<script setup lang="ts">
const openOptions = () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL("options/options.html"));
  }
};
</script>

<template>
  <div class="container">
    <div class="header">
      <span class="app-name">umiriCopy</span>
      <span class="app-version">v0.1.0</span>
    </div>
    <p class="app-desc">一键复制推文到剪贴板</p>
    <button class="config-btn" @click="openOptions">
      <svg viewBox="0 0 24 24" class="gear-icon" aria-hidden="true">
        <path
          d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
        />
      </svg>
      <span class="btn-text">翻译配置</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.container {
  padding: 16px;
  background-color: #fff;
  min-width: 200px;
}

.header {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 2px;
}

.app-name {
  font-size: 17px;
  font-weight: 800;
  color: rgb(15, 20, 25);
  white-space: nowrap;
}

.app-version {
  font-size: 12px;
  color: rgb(113, 118, 123);
  white-space: nowrap;
}

.app-desc {
  font-size: 13px;
  color: rgb(113, 118, 123);
  margin-bottom: 16px;
  white-space: nowrap;
}

.config-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  border-radius: 9999px;
  background-color: rgb(15, 20, 25);
  color: #fff;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}

.gear-icon {
  width: 16px;
  height: 16px;
  fill: #fff;
  flex-shrink: 0;
}

.btn-text {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;
}

.config-btn:hover {
  background-color: rgb(39, 44, 48);
}

.config-btn:active {
  background-color: rgb(47, 51, 54);
}
</style>
