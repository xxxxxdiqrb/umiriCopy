<script setup lang="ts">
import { appState } from "../store";
</script>

<template>
  <div v-if="appState.loading.visible" class="loading-overlay">
    <div class="loading-backdrop"></div>
    <div class="loading-content">
      <div class="loading-spinner">
        <svg viewBox="0 0 24 24" class="spinner-icon">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="rgb(47, 51, 54)"
            stroke-width="3"
            fill="none"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="rgb(29, 155, 240)"
            stroke-width="3"
            fill="none"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <div class="loading-text">{{ appState.loading.text }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-overlay {
  z-index: 20000;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.loading-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  width: 100%;
  height: 100%;
}

.loading-content {
  box-sizing: border-box;
  font-size: 16px;
  border-radius: 16px;
  position: fixed;
  background-color: rgb(21, 22, 23);
  border: 1px solid rgb(47, 51, 54);
  padding: 24px 32px;
  transform: translate3d(-50%, -50%, 0);
  left: 50%;
  top: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow:
    rgba(255, 255, 255, 0.2) 0px 0px 15px,
    rgba(255, 255, 255, 0.05) 0px 0px 30px;
  animation: fadeIn 0.2s ease-out;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-icon {
  width: 32px;
  height: 32px;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  color: rgb(239, 243, 244);
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  font-size: 15px;
  line-height: 1.5;
  text-align: center;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate3d(-50%, -50%, 0) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate3d(-50%, -50%, 0) scale(1);
  }
}
</style>
