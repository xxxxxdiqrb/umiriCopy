<script setup lang="ts">
import { computed } from "vue";
import { appState } from "../store";

const props = defineProps<{
  article: HTMLElement;
  articleId: string;
}>();

const articleId = props.articleId;

const isSelected = computed(() => appState.selectedArticles.has(articleId));

const handleClick = (e: MouseEvent) => {
  e.stopPropagation();
  if (appState.selectedArticles.has(articleId)) {
    appState.selectedArticles.delete(articleId);
  } else {
    appState.selectedArticles.add(articleId);
  }
};
</script>

<template>
  <div
    class="article-selector-overlay"
    :class="{ 'selected-overlay': isSelected }"
    @click="handleClick"
  >
    <div v-if="isSelected" class="indicator-wrapper">
      <div class="pill-badge">
        <svg viewBox="0 0 24 24" class="pill-check-icon">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        <span>已选</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.article-selector-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: pointer;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.selected-overlay {
  background-color: rgba(29, 155, 240, 0.12);
}

.indicator-wrapper {
  position: absolute;
  top: 12px;
  right: 12px;
  pointer-events: none;
}

.pill-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px 2px 6px;
  border-radius: 9999px;
  background-color: rgb(29, 155, 240);
  transition: opacity 0.15s ease;

  .pill-check-icon {
    width: 14px;
    height: 14px;
    fill: rgb(255, 255, 255);
  }

  span {
    color: rgb(255, 255, 255);
    font-size: 12px;
    font-weight: 700;
    font-family:
      -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial,
      sans-serif;
    white-space: nowrap;
    line-height: 20px;
  }
}
</style>
