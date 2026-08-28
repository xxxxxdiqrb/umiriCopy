<script setup lang="ts">
import type { PlatformSettings, ProviderConfig } from '../types';

const props = defineProps<{
  title: string;
  platformKey: 'twitter' | 'instagram';
  modelValue: PlatformSettings;
  providers: ProviderConfig[];
  hasScreenshot?: boolean;
  hasAlt?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: PlatformSettings];
  change: [];
}>();

const updateSetting = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
  const updated = {
    ...props.modelValue,
    [key]: value,
  };

  // 联动逻辑：如果关闭复制图片，自动将下载到本地也关闭
  if (key === 'copyImages' && !value) {
    updated.download = false;
    if (props.hasAlt) {
      updated.getAlt = false;
    }
  }

  emit('update:modelValue', updated);
  emit('change');
};
</script>

<template>
  <div class="platform-settings-card">
    <div class="card-header">
      <span class="platform-title">{{ title }}</span>
    </div>
    <div class="card-body">
      <!-- 是否翻译 -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">默认开启翻译</span>
          <span class="setting-desc">点击复制时默认启用 AI 翻译</span>
        </div>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: modelValue.translate }"
          @click="updateSetting('translate', !modelValue.translate)"
        >
          <span class="toggle-indicator"></span>
        </button>
      </div>

      <!-- 默认翻译服务 -->
      <div v-if="modelValue.translate" class="setting-row">
        <div class="setting-info">
          <span class="setting-label">默认翻译服务</span>
          <span class="setting-desc">未指定时跟随全局默认服务</span>
        </div>
        <select
          class="select-input"
          :value="modelValue.providerId ?? ''"
          @change="updateSetting('providerId', ($event.target as HTMLSelectElement).value || null)"
        >
          <option value="">跟随全局默认</option>
          <option v-for="provider in providers" :key="provider.id" :value="provider.id">
            {{ provider.name }}
          </option>
        </select>
      </div>

      <!-- 是否截图 (Twitter 特有) -->
      <div v-if="hasScreenshot" class="setting-row">
        <div class="setting-info">
          <span class="setting-label">默认截取原推文图片</span>
          <span class="setting-desc">生成推文视觉卡片并置入剪贴板</span>
        </div>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: modelValue.captureScreenshot }"
          @click="updateSetting('captureScreenshot', !modelValue.captureScreenshot)"
        >
          <span class="toggle-indicator"></span>
        </button>
      </div>

      <!-- 复制图片 -->
      <div class="setting-row">
        <div class="setting-info">
          <span class="setting-label">默认复制图片</span>
          <span class="setting-desc">获取帖子附带的媒体图片</span>
        </div>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: modelValue.copyImages }"
          @click="updateSetting('copyImages', !modelValue.copyImages)"
        >
          <span class="toggle-indicator"></span>
        </button>
      </div>

      <!-- 下载图片到本地 -->
      <div v-if="modelValue.copyImages" class="setting-row">
        <div class="setting-info">
          <span class="setting-label">默认图片下载到本地</span>
          <span class="setting-desc">复制时将图片自动保存到浏览器下载目录</span>
        </div>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: modelValue.download }"
          @click="updateSetting('download', !modelValue.download)"
        >
          <span class="toggle-indicator"></span>
        </button>
      </div>

      <template v-if="hasAlt">
        <div v-if="modelValue.copyImages" class="setting-row">
          <div class="setting-info">
            <span class="setting-label">默认获取 ALT</span>
            <span class="setting-desc">复制图片时同时获取图片说明文字</span>
          </div>
          <button
            type="button"
            class="toggle-btn"
            :class="{ active: modelValue.getAlt }"
            @click="updateSetting('getAlt', !modelValue.getAlt)"
          >
            <span class="toggle-indicator"></span>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$border-color: rgb(239, 243, 244);
$text-primary: rgb(15, 20, 25);
$text-secondary: rgb(113, 118, 123);
$accent: rgb(29, 155, 240);

.platform-settings-card {
  background: rgb(255, 255, 255);
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  padding-bottom: 8px;
  border-bottom: 1px solid $border-color;
}

.platform-title {
  font-size: 16px;
  font-weight: 700;
  color: $text-primary;
}

.card-body {
  display: flex;
  flex-direction: column;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(239, 243, 244, 0.6);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
}

.setting-desc {
  font-size: 12px;
  color: $text-secondary;
}

.select-input {
  background-color: rgb(255, 255, 255);
  color: $text-primary;
  border: 1px solid rgb(207, 217, 222);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  min-width: 140px;
  outline: none;

  &:focus {
    border-color: $accent;
  }
}

.toggle-btn {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: rgb(207, 217, 222);
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  flex-shrink: 0;

  &.active {
    background-color: $accent;
  }
}

.toggle-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgb(255, 255, 255);
  transition: transform 0.2s;

  .toggle-btn.active & {
    transform: translateX(20px);
  }
}
</style>
