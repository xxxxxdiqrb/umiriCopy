<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  download: [];
}>();
</script>

<template>
  <div v-if="visible" class="config-bar-overlay" @click.self="emit('cancel')">
    <div class="config-bar">
      <button class="cancel-btn" @click="emit('cancel')">取消</button>
      <button class="download-btn" @click="emit('download')">下载视频</button>
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

.download-btn {
  @extend %base-btn;
  color: white;
  border: 1px solid white;
  background-color: rgb(15, 20, 25);
}
</style>
