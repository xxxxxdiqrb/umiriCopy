<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { appState, showToast } from "../store";
import twemoji from "twemoji";

const editorRef = ref<HTMLDivElement | null>(null);

watch(
  () => appState.previewDialog.visible,
  async (visible) => {
    if (visible) {
      await nextTick();
      if (editorRef.value) {
        const content = appState.previewDialog.content.replace(/\n/g, "<br>");
        editorRef.value.innerHTML = twemoji.parse(content);
      }
    }
  },
);

const handleCancel = () => {
  appState.previewDialog.visible = false;
};

const handleCopy = async () => {
  if (!editorRef.value) return;
  try {
    const clone = editorRef.value.cloneNode(true) as HTMLDivElement;
    clone.querySelectorAll("img[data-original-src]").forEach((img) => {
      const originalSrc = img.getAttribute("data-original-src");
      if (originalSrc) {
        const src = originalSrc.startsWith("file://")
          ? originalSrc
          : `file://${originalSrc}`;
        img.setAttribute("src", src);
        img.removeAttribute("data-original-src");
      }
    });
    clone.querySelectorAll("img.emoji").forEach((img) => {
      const alt = img.getAttribute("alt");
      if (alt) {
        img.replaceWith(alt);
      }
    });
    const html = clone.innerHTML;
    const type = "text/html";
    const blob = new Blob([html], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(data);
    showToast("复制成功");
    appState.previewDialog.visible = false;
  } catch (error) {
    appState.actionBar.message = `复制失败: ${error instanceof Error ? error.message : "未知错误"}`;
    appState.actionBar.buttonText = "确定";
    appState.actionBar.handler = null;
    appState.actionBar.visible = true;
  }
};
</script>

<template>
  <div v-if="appState.previewDialog.visible" class="preview-overlay">
    <div class="preview-dialog">
      <div class="preview-header">预览内容并编辑</div>
      <div ref="editorRef" class="preview-editor" contenteditable="true"></div>
      <div class="preview-actions">
        <button class="cancel-btn" @click="handleCancel">取消</button>
        <button class="copy-btn" @click="handleCopy">复制</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.preview-overlay {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 20001;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-dialog {
  box-sizing: border-box;
  background-color: rgb(21, 22, 23);
  border: 1px solid rgb(47, 51, 54);
  border-radius: 16px;
  padding: 20px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow:
    rgba(255, 255, 255, 0.2) 0px 0px 15px,
    rgba(255, 255, 255, 0.05) 0px 0px 30px;
  animation: fadeIn 0.2s ease-out;
}

.preview-header {
  color: rgb(239, 243, 244);
  font-size: 18px;
  font-weight: bold;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  margin-bottom: 16px;
  text-align: center;
}

.preview-editor {
  flex: 1;
  min-height: 200px;
  max-height: 60vh;
  background-color: rgb(15, 20, 25);
  border: 1px solid rgb(47, 51, 54);
  border-radius: 8px;
  padding: 16px 20px;
  font-size: 16px;
  color: rgb(239, 243, 244);
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  line-height: 1.5;
  outline: none;
  box-sizing: border-box;
  overflow-y: auto;
  word-wrap: break-word;

  &:empty::before {
    content: "无内容";
    color: rgb(113, 118, 123);
  }

  :deep(img) {
    max-width: 99%;
    height: auto;
    display: block;
    margin: 8px 0;
  }

  :deep(img.emoji) {
    display: inline-block;
    width: 1.2em;
    height: 1.2em;
    margin: 0 0.075em;
    vertical-align: -20%;
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.5);
    border-radius: 2px;

    &:hover {
      background: rgba(255, 255, 255, 0.8);
    }
  }
}

.preview-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

%base-btn {
  flex: 1;
  padding: 12px;
  border-radius: 9999px;
  text-align: center;
  font-weight: bold;
  font-size: 15px;
  cursor: pointer;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
    sans-serif;
  transition: opacity 0.2s;

  &:active {
    opacity: 0.7;
  }

  &:hover {
    opacity: 0.8;
  }
}

.cancel-btn {
  @extend %base-btn;
  color: rgb(239, 243, 244);
  border: 1px solid white;
  background-color: transparent;
}

.copy-btn {
  @extend %base-btn;
  color: rgb(15, 20, 25);
  border: none;
  background-color: white;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
