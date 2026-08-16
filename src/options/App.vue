<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import type { ProviderConfig, OptionsData, PlatformConfigs } from "./types";
import { createDefaultProvider, DEFAULT_PLATFORM_CONFIGS } from "./types";
import ProviderCard from "./components/ProviderCard.vue";
import ProviderModal from "./components/ProviderModal.vue";
import PlatformSettingsCard from "./components/PlatformSettingsCard.vue";

const activeTab = ref<"providers" | "platforms">("providers");

const options = ref<OptionsData>({
  providers: [],
  defaultProviderId: null,
  platformConfigs: {
    twitter: { ...DEFAULT_PLATFORM_CONFIGS.twitter },
    instagram: { ...DEFAULT_PLATFORM_CONFIGS.instagram },
  },
});

const showModal = ref(false);
const editingProvider = ref<ProviderConfig | null>(null);
const modalRef = ref<InstanceType<typeof ProviderModal> | null>(null);

onMounted(async () => {
  const result = await chrome.storage.local.get("options");
  console.log(result);
  if (result.options) {
    const loaded = result.options;
    let providers: ProviderConfig[] = [];
    if (Array.isArray(loaded.providers)) {
      providers = loaded.providers;
    } else if (loaded.providers && typeof loaded.providers === "object") {
      providers = Object.values(loaded.providers);
    }

    const loadedPlatformConfigs = loaded.platformConfigs || {};
    const platformConfigs: PlatformConfigs = {
      twitter: {
        ...DEFAULT_PLATFORM_CONFIGS.twitter,
        ...(loadedPlatformConfigs.twitter || {}),
      },
      instagram: {
        ...DEFAULT_PLATFORM_CONFIGS.instagram,
        ...(loadedPlatformConfigs.instagram || {}),
      },
    };

    options.value = {
      providers,
      defaultProviderId: loaded.defaultProviderId ?? null,
      platformConfigs,
    };
  }
});

const saveOptions = async () => {
  await chrome.storage.local.set({ options: options.value });
};

const openAddModal = async () => {
  editingProvider.value = createDefaultProvider();
  showModal.value = true;
  await nextTick();
  modalRef.value?.onOpen();
};

const openEditModal = async (provider: ProviderConfig) => {
  editingProvider.value = { ...provider };
  showModal.value = true;
  await nextTick();
  modalRef.value?.onOpen();
};

const closeModal = () => {
  showModal.value = false;
  editingProvider.value = null;
};

const saveProvider = async (provider: ProviderConfig) => {
  const existingIndex = options.value.providers.findIndex(
    (p) => p.id === provider.id,
  );

  if (existingIndex >= 0) {
    options.value.providers[existingIndex] = { ...provider };
  } else {
    options.value.providers.push({ ...provider });
    if (options.value.providers.length === 1) {
      options.value.defaultProviderId = provider.id;
    }
  }

  await saveOptions();
  closeModal();
};

const deleteProvider = async (provider: ProviderConfig) => {
  if (!confirm(`确定要删除 "${provider.name}" 吗？`)) return;

  const index = options.value.providers.findIndex((p) => p.id === provider.id);
  if (index >= 0) {
    options.value.providers.splice(index, 1);
    if (options.value.defaultProviderId === provider.id) {
      options.value.defaultProviderId = options.value.providers[0]?.id || null;
    }
    await saveOptions();
  }
};

const setAsDefault = async (provider: ProviderConfig) => {
  options.value.defaultProviderId = provider.id;
  await saveOptions();
};
</script>

<template>
  <div class="container">
    <div class="header">
      <span class="app-name">扩展配置管理</span>
    </div>

    <!-- 选项卡导航 -->
    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'providers' }"
        @click="activeTab = 'providers'"
      >
        AI 翻译服务
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'platforms' }"
        @click="activeTab = 'platforms'"
      >
        平台默认配置
      </button>
    </div>

    <!-- AI 翻译配置板块 -->
    <div v-show="activeTab === 'providers'" class="tab-content">
      <button class="add-btn" @click="openAddModal">
        <svg viewBox="0 0 24 24" class="add-icon" aria-hidden="true">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        <span class="btn-text">添加翻译配置</span>
      </button>

      <div class="provider-list">
        <div v-if="options.providers.length === 0" class="empty-state">
          暂无配置，点击上方按钮添加
        </div>

        <ProviderCard
          v-for="provider in options.providers"
          :key="provider.id"
          :provider="provider"
          :is-default="provider.id === options.defaultProviderId"
          @edit="openEditModal"
          @delete="deleteProvider"
          @set-default="setAsDefault"
        />
      </div>
    </div>

    <!-- 平台默认配置板块 -->
    <div v-show="activeTab === 'platforms'" class="tab-content">
      <div v-if="options.platformConfigs" class="platforms-list">
        <PlatformSettingsCard
          v-model="options.platformConfigs.twitter"
          title="X (Twitter) 默认选项"
          platform-key="twitter"
          :providers="options.providers"
          has-screenshot
          @change="saveOptions"
        />

        <PlatformSettingsCard
          v-model="options.platformConfigs.instagram"
          title="Instagram 默认选项"
          platform-key="instagram"
          :providers="options.providers"
          @change="saveOptions"
        />
      </div>
    </div>

    <ProviderModal
      ref="modalRef"
      v-model="showModal"
      :provider="editingProvider"
      :existing-providers="options.providers"
      @save="saveProvider"
    />
  </div>
</template>

<style lang="scss" scoped>
$bg-page: rgb(255, 255, 255);
$border-color: rgb(239, 243, 244);
$text-primary: rgb(15, 20, 25);
$text-secondary: rgb(113, 118, 123);
$accent: rgb(29, 155, 240);
$accent-hover: rgb(26, 140, 216);

.container {
  padding: 20px;
  width: 100%;
  min-height: 100vh;
  background: $bg-page;
  color: $text-primary;
  max-width: 1024px;
  margin: 0 auto;
  box-sizing: border-box;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}

.header {
  margin-bottom: 20px;
}

.app-name {
  font-size: 22px;
  font-weight: 800;
  color: $text-primary;
}

.tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid $border-color;
  margin-bottom: 20px;
}

.tab-btn {
  background: transparent;
  border: none;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 600;
  color: $text-secondary;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  font-family: inherit;

  &:hover {
    color: $text-primary;
  }

  &.active {
    color: $text-primary;
    border-bottom-color: $text-primary;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 9999px;
  background: $text-primary;
  color: rgb(255, 255, 255);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  font-family: inherit;
  margin-bottom: 20px;

  &:hover {
    background: rgb(39, 44, 48);
  }

  &:active {
    background: rgb(47, 51, 54);
  }
}

.add-icon {
  width: 18px;
  height: 18px;
  fill: rgb(255, 255, 255);
  flex-shrink: 0;
}

.btn-text {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;
}

.provider-list,
.platforms-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: $text-secondary;
  border: 1px dashed $border-color;
  border-radius: 16px;
  font-size: 15px;
}
</style>
