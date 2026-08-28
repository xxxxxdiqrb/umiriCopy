<script setup lang="ts">
import { computed } from 'vue';
import { appState, closeActionBar, type ActionBarAction } from '../store';

const computedActions = computed<ActionBarAction[]>(() => {
  if (appState.actionBar.actions && appState.actionBar.actions.length > 0) {
    return appState.actionBar.actions;
  }

  const actions: ActionBarAction[] = [
    {
      label: appState.actionBar.buttonText || '确定',
      type: appState.actionBar.retryVisible ? 'secondary' : 'primary',
      handler: appState.actionBar.handler,
    },
  ];

  if (appState.actionBar.retryVisible) {
    actions.push({
      label: '重试',
      type: 'primary',
      handler: appState.actionBar.retryHandler,
    });
  }

  return actions;
});

const handleActionClick = (action: ActionBarAction) => {
  const handler = action.handler;
  closeActionBar();
  handler?.();
};
</script>

<template>
  <div v-if="appState.actionBar.visible" class="actionbar-overlay">
    <div class="actionbar-content">
      <div class="actionbar-text">{{ appState.actionBar.message }}</div>
      <div class="actionbar-actions">
        <button
          v-for="(action, index) in computedActions"
          :key="index"
          class="actionbar-btn"
          :class="{
            'actionbar-btn--secondary': action.type === 'secondary',
            'actionbar-btn--primary': action.type !== 'secondary',
          }"
          @click="handleActionClick(action)"
        >
          {{ action.label }}
        </button>
      </div>
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  text-align: center;
}

.actionbar-actions {
  display: flex;
  gap: 12px;
}

.actionbar-btn {
  text-align: center;
  flex: 1;
  border-radius: 9999px;
  padding: 12px;
  font-size: 16px;
  font-weight: bold;
  line-height: 1.5;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.7;
  }
}

.actionbar-btn--primary {
  background-color: white;
  color: rgb(15, 20, 25);
  border: none;
}

.actionbar-btn--secondary {
  background-color: transparent;
  color: rgb(239, 243, 244);
  border: 1px solid white;
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
