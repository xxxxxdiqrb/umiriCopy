<script setup lang="ts">
import { appState } from "../store";

const handleButtonClick = () => {
  appState.actionBar.handler?.();
  appState.actionBar.visible = false;
};
</script>

<template>
  <div v-if="appState.actionBar.visible" class="actionbar-overlay">
    <div class="actionbar-content">
      <div class="actionbar-text">{{ appState.actionBar.message }}</div>
      <button class="actionbar-btn" @click="handleButtonClick">
        {{ appState.actionBar.buttonText }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.actionbar-overlay {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 20000;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.actionbar-content {
  box-sizing: border-box;
  font-size: 16px;
  border-radius: 16px;
  position: fixed;
  background-color: rgb(21, 22, 23);
  border: 1px solid rgb(47, 51, 54);
  padding: 24px;
  transform: translate3d(-50%, -50%, 0);
  left: 50%;
  top: 50%;
  min-width: 280px;
  max-width: 360px;
  box-shadow:
    rgba(255, 255, 255, 0.2) 0px 0px 15px,
    rgba(255, 255, 255, 0.05) 0px 0px 30px;
  animation: fadeIn 0.2s ease-out;
}

.actionbar-text {
  box-sizing: border-box;
  margin-bottom: 20px;
  color: rgb(239, 243, 244);
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  font-size: 15px;
  line-height: 1.5;
  text-align: center;
}

.actionbar-btn {
  text-align: center;
  width: 100%;
  border-radius: 9999px;
  border: 1px solid white;
  padding: 12px;
  font-size: 16px;
  font-weight: bold;
  color: rgb(15, 20, 25);
  line-height: 1.5;
  border: none;
  cursor: pointer;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgb(26, 140, 216);
  }

  &:active {
    background-color: rgb(22, 125, 192);
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
