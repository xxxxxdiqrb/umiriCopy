<script setup lang="ts">
import { appState } from '../store'

const handleButtonClick = () => {
  appState.actionBar.handler?.()
  appState.actionBar.visible = false
}
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
  background-color: rgba(0, 0, 0, 0.6);
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
  border-radius: 2px;
  position: fixed;
  background-color: rgb(255, 255, 255);
  padding: 16px 20px;
  transform: translate3d(-50%, -50%, 0);
  left: 50%;
  top: 50%;
}

.actionbar-text {
  box-sizing: border-box;
  margin-bottom: 14px;
}

.actionbar-btn {
  text-align: center;
  width: 100%;
  border-radius: 2px;
  background-color: rgb(53, 53, 53);
  padding: 6px 12px;
  font-size: 12px;
  color: rgb(255, 255, 255);
  line-height: 1.5;
  border: none;
  cursor: pointer;

  &:active {
    opacity: 0.6;
  }
}
</style>
