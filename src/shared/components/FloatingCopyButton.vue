<script setup lang="ts">
defineProps<{
  label?: string;
  icon?: string;
  visible?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <div class="floating-btn-wrapper" v-if="visible !== false">
    <button class="floating-copy-btn" @click="emit('click')">
      <slot name="icon">
        <svg viewBox="0 0 24 24" class="copy-icon" aria-hidden="true">
          <path
            d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
          />
        </svg>
      </slot>
      <span class="copy-text">{{ label || "复制" }}</span>
    </button>
  </div>
</template>

<style lang="scss" scoped>
.floating-btn-wrapper {
  position: fixed;
  top: 60px;
  right: 0;
  z-index: 19999;
}

.floating-copy-btn:hover {
  transform: translateX(0);
  background-color: rgb(39, 44, 48);
}

.floating-copy-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px 0 12px;
  border-radius: 18px 0 0 18px;
  border: none;
  background-color: rgb(15, 20, 25);
  cursor: pointer;
  transform: translateX(calc(100% - 36px));
  transition:
    transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.2s;
  user-select: none;
}

.copy-icon {
  width: 16px;
  height: 16px;
  fill: rgb(255, 255, 255);
  flex-shrink: 0;
}

.copy-text {
  color: rgb(255, 255, 255);
  font-size: 14px;
  font-weight: 700;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  white-space: nowrap;
}
</style>
