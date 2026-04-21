<script setup lang="ts">
import { appState, applyProvider } from "../store";
import {
  unmountAllSelectors,
  getSelectedArticleElements,
} from "../composables/useTweetObserver";
import { copyTweet } from "../composables/useCopyTweet";
import { showToast } from "../store";

const handleCancel = () => {
  appState.configBar.visible = false;
  appState.selectMode.active = false;
  appState.selectedArticles.clear();
  unmountAllSelectors();
};

const getErrorMessage = (error: unknown): string => {
  const errorStr = String(error);

  const errorMap: Record<string, string> = {
    "401": "API Key 无效或已过期，请检查翻译配置",
    "403": "API 访问被拒绝，请检查 API Key 权限",
    "404": "API 地址不存在，请检查 Base URL",
    "429": "API 请求过于频繁，请稍后重试",
    "500": "API 服务暂时不可用",
    "502": "API 服务网关错误",
    "503": "API 服务暂不可用",
  };

  for (const [code, msg] of Object.entries(errorMap)) {
    if (errorStr.includes(code)) return msg;
  }

  if (
    errorStr.includes("fetch") ||
    errorStr.includes("network") ||
    errorStr.includes("Network")
  ) {
    return "网络连接失败，请检查网络连接";
  }

  return errorStr;
};

const handleSubmit = async () => {
  const articles = getSelectedArticleElements();
  if (articles.length === 0) {
    handleCancel();
    return;
  }

  if (appState.configBar.translate) {
    const selectedProvider = appState.providers.find(
      (p) => p.id === appState.configBar.selectedProviderId
    );
    if (!selectedProvider || !selectedProvider.apiKey) {
      showToast("请先进行翻译配置", "error");
      return;
    }
  }

  appState.loading.visible = true;
  appState.loading.text = "正在复制";

  try {
    const copyString = await copyTweet(articles);
    appState.previewDialog.content = copyString;
    appState.previewDialog.visible = true;
  } catch (e) {
    console.error(e);
    const stage = appState.loading.text;
    const stageName = stage.includes("翻译")
      ? "翻译"
      : stage.includes("截图")
        ? "截图"
        : stage.includes("图片")
          ? "图片下载"
          : "资源获取";
    appState.actionBar.message = `${stageName}失败：${getErrorMessage(e)}`;
    appState.actionBar.buttonText = "确定";
    appState.actionBar.handler = null;
    appState.actionBar.visible = true;
  } finally {
    appState.loading.visible = false;
    appState.configBar.visible = false;
    appState.selectMode.active = false;
    appState.selectedArticles.clear();
    unmountAllSelectors();
  }
};

const handleToggleTranslate = () => {
  appState.configBar.translate = !appState.configBar.translate;
};

const handleToggleCopyImages = () => {
  appState.configBar.copyImages = !appState.configBar.copyImages;
  if (!appState.configBar.copyImages) {
    appState.configBar.download = false;
  }
};

const handleToggleDownload = () => {
  appState.configBar.download = !appState.configBar.download;
};

const handleProviderChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const providerId = target.value || null;
  appState.configBar.selectedProviderId = providerId;
  if (providerId) {
    const provider = appState.providers.find((p) => p.id === providerId);
    if (provider) {
      applyProvider(provider);
    }
  }
};
</script>

<template>
  <div
    v-if="appState.configBar.visible"
    class="config-bar-overlay"
    @click.self="handleCancel"
  >
    <div class="config-bar">
      <div class="config-item">
        <span class="config-label">是否翻译</span>
        <button
          class="toggle-btn"
          :class="{ active: appState.configBar.translate }"
          @click="handleToggleTranslate"
        >
          <span class="toggle-indicator"></span>
        </button>
      </div>
      <div v-if="appState.configBar.translate" class="config-item">
        <span class="config-label">翻译服务</span>
        <select
          class="provider-select"
          :value="appState.configBar.selectedProviderId || ''"
          @change="handleProviderChange"
        >
          <option value="" disabled>请选择配置</option>
          <option
            v-for="provider in appState.providers"
            :key="provider.id"
            :value="provider.id"
          >
            {{ provider.name }}
          </option>
        </select>
      </div>
      <div class="config-item">
        <span class="config-label">复制图片</span>
        <button
          class="toggle-btn"
          :class="{ active: appState.configBar.copyImages }"
          @click="handleToggleCopyImages"
        >
          <span class="toggle-indicator"></span>
        </button>
      </div>
      <div v-if="appState.configBar.copyImages" class="config-item">
        <span class="config-label">图片下载到本地</span>
        <button
          class="toggle-btn"
          :class="{ active: appState.configBar.download }"
          @click="handleToggleDownload"
        >
          <span class="toggle-indicator"></span>
        </button>
      </div>
      <div class="config-item">
        <span class="config-label">已选中推文</span>
        <span class="config-value">{{ appState.selectedArticles.size }}</span>
      </div>
      <button class="cancel-btn" @click="handleCancel">取消</button>
      <button class="submit-btn" @click="handleSubmit">复制</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.config-bar-overlay {
  position: fixed;
  top: 110px;
  right: 0;
  z-index: 19998;
  display: flex;
  justify-content: center;
  width: fit-content;
  height: fit-content;
}

.config-bar {
  background-color: rgb(21, 22, 23);
  border: 1px solid rgb(47, 51, 54);
  border-bottom: none;
  border-radius: 16px 0 0 16px;
  padding: 16px 20px;
  padding-bottom: 30px;
  min-width: 300px;
  box-sizing: border-box;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgb(47, 51, 54);

  &:last-of-type {
    border-bottom: none;
  }
}

.config-label {
  color: rgb(239, 243, 244);
  font-size: 15px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}

.config-value {
  color: white;
  font-size: 15px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}

.provider-select {
  background-color: rgb(32, 35, 39);
  color: rgb(239, 243, 244);
  border: 1px solid rgb(56, 68, 77);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 14px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  cursor: pointer;
  min-width: 120px;
  outline: none;

  &:focus {
    border-color: rgb(29, 155, 240);
  }

  option {
    background-color: rgb(21, 22, 23);
    color: rgb(239, 243, 244);
  }
}

.toggle-btn {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: rgb(51, 54, 57);
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;

  &.active {
    background-color: rgb(29, 155, 240);
  }
}

.toggle-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgb(239, 243, 244);
  transition: transform 0.2s;

  .toggle-btn.active & {
    transform: translateX(20px);
  }
}

%base-btn {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  border-radius: 9999px;
  text-align: center;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;

  &:active {
    opacity: 0.7;
  }

  &:hover {
    opacity: 0.7;
  }
}

.cancel-btn {
  @extend %base-btn;
  color: rgb(15, 20, 25);
  border: 1px solid white;
  background-color: white;
}

.submit-btn {
  @extend %base-btn;
  color: white;
  border: 1px solid white;
  background-color: rgb(15, 20, 25);
}
</style>
