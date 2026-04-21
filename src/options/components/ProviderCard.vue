<script setup lang="ts">
import type { ProviderConfig } from "../types";

defineProps<{
  provider: ProviderConfig;
  isDefault: boolean;
}>();

const emit = defineEmits<{
  edit: [provider: ProviderConfig];
  delete: [provider: ProviderConfig];
  setDefault: [provider: ProviderConfig];
}>();
</script>

<template>
  <div class="provider-card" :class="{ 'is-default': isDefault }">
    <div class="provider-header">
      <div class="provider-name">
        {{ provider.name }}
        <span v-if="isDefault" class="default-badge">默认</span>
      </div>
      <div class="provider-actions">
        <button
          v-if="!isDefault"
          class="btn btn-outline"
          @click="emit('setDefault', provider)"
        >
          设为默认
        </button>
        <button class="btn btn-outline" @click="emit('edit', provider)">
          编辑
        </button>
        <button
          class="btn btn-outline btn-danger"
          @click="emit('delete', provider)"
        >
          删除
        </button>
      </div>
    </div>
    <div class="provider-info">
      <div class="info-row">
        <span class="label">API地址</span>
        <span class="value">{{ provider.baseUrl }}</span>
      </div>
      <div class="info-row">
        <span class="label">模型</span>
        <span class="value">{{ provider.model }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$border-color: rgb(239, 243, 244);
$text-primary: rgb(15, 20, 25);
$text-secondary: rgb(113, 118, 123);
$accent: rgb(15, 20, 25);
$danger: rgb(244, 33, 46);

.provider-card {
  background: rgb(255, 255, 255);
  border-radius: 16px;
  padding: 16px;
  transition: background-color 0.2s;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);

  &.is-default {
    // 占位，暂时没想到要怎么设计这部分
  }
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.provider-name {
  font-size: 16px;
  font-weight: 700;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: 8px;
}

.default-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  background: $accent;
  color: rgb(255, 255, 255);
  border-radius: 4px;
}

.provider-actions {
  display: flex;
  gap: 8px;
}

.provider-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  font-size: 14px;

  .label {
    color: $text-secondary;
    width: 100px;
    flex-shrink: 0;
  }

  .value {
    color: $text-primary;
    word-break: break-all;
  }
}

.btn {
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 9999px;
  background: transparent;
  transition: background-color 0.2s;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
}

.btn-outline {
  border: 1px solid $text-primary;
  color: $text-primary;

  &:hover:not(:disabled) {
    background: rgba(15, 20, 25, 0.1);
  }

  &:active:not(:disabled) {
    background: rgba(15, 20, 25, 0.2);
  }
}

.btn-danger {
  color: $danger;
  border-color: $danger;

  &:hover:not(:disabled) {
    background: rgba($danger, 0.1);
  }
}
</style>
