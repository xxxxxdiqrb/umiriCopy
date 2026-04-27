<script setup lang="ts">
import type { ConfigItem } from "../types";
import { computed } from "vue";

const props = defineProps<{
  visible: boolean;
  items: ConfigItem[];
  selectedCount: number;
  submitLabel: string;
  selectedCountLabel: string;
  showDownloadVideo?: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  submit: [];
  "update:item": [key: string, value: boolean | string];
  downloadVideo: [];
}>();

const visibleItems = computed(() => {
  return props.items.filter((item) => {
    if (!item.dependsOn) return true;
    const parent = props.items.find((i) => i.key === item.dependsOn);
    if (!parent) return true;
    return parent.value === true;
  });
});

const handleToggle = (item: ConfigItem) => {
  if (item.type === "toggle") {
    emit("update:item", item.key, !item.value);
  }
};

const handleSelectChange = (item: ConfigItem, event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit("update:item", item.key, target.value);
};
</script>

<template>
  <div v-if="visible" class="config-bar-overlay" @click.self="emit('cancel')">
    <div class="config-bar">
      <template v-for="item in visibleItems" :key="item.key">
        <div v-if="item.type === 'toggle'" class="config-item">
          <span class="config-label">{{ item.label }}</span>
          <button class="toggle-btn" :class="{ active: item.value }" @click="handleToggle(item)">
            <span class="toggle-indicator"></span>
          </button>
        </div>
        <div v-else-if="item.type === 'select'" class="config-item">
          <span class="config-label">{{ item.label }}</span>
          <select class="provider-select" :value="item.value" @change="handleSelectChange(item, $event)">
            <option value="" disabled>请选择配置</option>
            <option v-for="opt in item.options" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </template>
      <div class="config-item">
        <span class="config-label">{{ selectedCountLabel }}</span>
        <span class="config-value">{{ selectedCount }}</span>
      </div>
      <button class="cancel-btn" @click="emit('cancel')">取消</button>
      <button class="submit-btn" @click="emit('submit')">{{ submitLabel }}</button>
      <button v-if="showDownloadVideo" class="download-btn" @click="emit('downloadVideo')">下载视频</button>
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.config-value {
  color: white;
  font-size: 15px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.provider-select {
  background-color: rgb(32, 35, 39);
  color: rgb(239, 243, 244);
  border: 1px solid rgb(56, 68, 77);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

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

.submit-btn,
.download-btn {
  @extend %base-btn;
  color: white;
  border: 1px solid white;
  background-color: rgb(15, 20, 25);
}
</style>
