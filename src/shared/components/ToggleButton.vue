<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean;
    activeColor?: string;
    inactiveColor?: string;
    indicatorColor?: string;
    title?: string;
  }>(),
  {
    active: false,
    activeColor: 'rgb(15, 20, 25)',
    inactiveColor: 'rgb(207, 217, 222)',
    indicatorColor: 'rgb(255, 255, 255)',
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    type="button"
    class="toggle-btn"
    :class="{ active }"
    :aria-pressed="active"
    :title="title"
    :style="{
      '--toggle-active-color': activeColor,
      '--toggle-inactive-color': inactiveColor,
      '--toggle-indicator-color': indicatorColor,
    }"
    @click="emit('click', $event)"
  >
    <span class="toggle-indicator"></span>
  </button>
</template>

<style lang="scss" scoped>
.toggle-btn {
  position: relative;
  flex: 0 0 auto;
  width: 44px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 12px;
  background-color: var(--toggle-inactive-color);
  cursor: pointer;
  transition: background-color 0.2s;

  &.active {
    background-color: var(--toggle-active-color);
  }
}

.toggle-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--toggle-indicator-color);
  transition: transform 0.2s;

  .toggle-btn.active & {
    transform: translateX(20px);
  }
}
</style>
