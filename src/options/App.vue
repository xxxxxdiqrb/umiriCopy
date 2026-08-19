<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import type { ProviderConfig, OptionsData, ExportedOptionsData } from "./types";
import { createDefaultProvider, DEFAULT_PLATFORM_CONFIGS, sanitizeOptionsData } from "./types";
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
const fileInputRef = ref<HTMLInputElement | null>(null);

const toastMessage = ref("");
const showToast = ref(false);
let toastTimer: number | null = null;

const displayToast = (msg: string) => {
  toastMessage.value = msg;
  showToast.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    showToast.value = false;
  }, 2500);
};

onMounted(async () => {
  const result = await chrome.storage.local.get("options");
  if (result.options) {
    options.value = sanitizeOptionsData(result.options);
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
  const existingIndex = options.value.providers.findIndex((p) => p.id === provider.id);

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

const exportConfig = () => {
  try {
    const manifest = chrome.runtime.getManifest();
    const exportData: ExportedOptionsData = {
      version: manifest?.version || "0.1.4",
      exportedAt: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(options.value)),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url;
    a.download = `umiriCopy-config-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    displayToast("配置已成功导出");
  } catch (error) {
    alert(`导出失败: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const triggerImport = () => {
  fileInputRef.value?.click();
};

const handleImportFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const raw = JSON.parse(text);
    const sanitized = sanitizeOptionsData(raw);

    if (!confirm("导入将覆盖当前全部配置，是否继续？")) {
      target.value = "";
      return;
    }

    options.value = sanitized;
    await saveOptions();
    displayToast("配置已成功导入并保存");
  } catch (error) {
    alert(`导入失败，配置文件格式不正确: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    target.value = "";
  }
};
</script>

<template>
  <div class="container">
    <div class="header">
      <span class="app-name">扩展配置管理</span>
      <div class="header-actions">
        <input ref="fileInputRef" type="file" accept=".json" class="hidden-file-input" @change="handleImportFile" />
        <button class="header-btn" title="导入配置文件" @click="triggerImport">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="btn-svg" aria-hidden="true">
            <path
              d="M256 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 210.7-41.4-41.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l96 96c12.5 12.5 32.8 12.5 45.3 0l96-96c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 242.7 256 32zM64 320c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-46.9 0-56.6 56.6c-31.2 31.2-81.9 31.2-113.1 0L110.9 320 64 320zm304 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"
            />
          </svg>
          <span>导入配置</span>
        </button>
        <button class="header-btn" title="导出配置文件为 JSON" @click="exportConfig">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="btn-svg" aria-hidden="true">
            <path
              d="M256 109.3L256 320c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-210.7-41.4 41.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l96-96c12.5-12.5 32.8-12.5 45.3 0l96 96c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 109.3zM224 400c44.2 0 80-35.8 80-80l80 0c35.3 0 64 28.7 64 64l0 32c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64l0-32c0-35.3 28.7-64 64-64l80 0c0 44.2 35.8 80 80 80zm144 24a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"
            />
          </svg>
          <span>导出配置</span>
        </button>
        <a
          class="header-btn github-btn"
          href="https://github.com/xxxxxdiqrb/umiriCopy"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub 仓库"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" class="btn-svg" aria-hidden="true">
            <path
              d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
            />
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </div>

    <div v-if="showToast" class="toast-banner">
      {{ toastMessage }}
    </div>

    <!-- 选项卡导航 -->
    <div class="tabs">
      <button class="tab-btn" :class="{ active: activeTab === 'providers' }" @click="activeTab = 'providers'">AI 翻译服务</button>
      <button class="tab-btn" :class="{ active: activeTab === 'platforms' }" @click="activeTab = 'platforms'">平台默认配置</button>
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
        <div v-if="options.providers.length === 0" class="empty-state">暂无配置，点击上方按钮添加</div>

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

    <ProviderModal ref="modalRef" v-model="showModal" :provider="editingProvider" :existing-providers="options.providers" @save="saveProvider" />
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.hidden-file-input {
  display: none;
}

.header-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid $border-color;
  border-radius: 9999px;
  background: transparent;
  color: $text-primary;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;

  &:hover {
    background: rgba(15, 20, 25, 0.05);
    border-color: rgba(15, 20, 25, 0.2);
  }

  &:active {
    background: rgba(15, 20, 25, 0.1);
  }

  .btn-svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
    flex-shrink: 0;
  }
}

.toast-banner {
  margin-bottom: 16px;
  padding: 10px 16px;
  background: rgba(0, 186, 124, 0.1);
  border: 1px solid rgba(0, 186, 124, 0.3);
  color: rgb(0, 186, 124);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
