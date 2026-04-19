<script setup lang="ts">
import { appState } from '../store'
</script>

<template>
  <div v-if="appState.loading.visible" class="loading-overlay">
    <div class="loading-backdrop"></div>
    <div class="loading-content">{{ appState.loading.text }}</div>
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
  background-color: rgba(0, 0, 0, 0.6);
  width: 100%;
  height: 100%;
}

.loading-content {
  box-sizing: border-box;
  font-size: 16px;
  border-radius: 2px;
  position: fixed;
  background-color: rgb(255, 255, 255);
  padding: 20px;
  transform: translate3d(-50%, -50%, 0);
  left: 50%;
  top: 50%;
}
</style>
