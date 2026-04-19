<script setup lang="ts">
import { ref, computed } from "vue";
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
    <div class="article-selector-overlay" :class="{ 'selected-overlay': isSelected }" @click="handleClick">
        <div class="checkbox-wrapper">
            <div class="checkbox" :class="{ checked: isSelected }">
                <svg v-if="isSelected" viewBox="0 0 24 24" class="check-icon">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
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
    transition: background-color 0.15s ease;

    &:hover {
        background-color: rgba(29, 155, 240, 0.1);
    }
}

.selected-overlay {
    background-color: rgba(29, 155, 240, 0.1);
}

.checkbox-wrapper {
    position: absolute;
    top: 12px;
    right: 12px;
    pointer-events: none;
}

.checkbox {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    border: 2px solid rgb(113, 118, 123);
    background-color: rgba(0, 0, 0, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
        background-color 0.15s ease,
        border-color 0.15s ease;

    &.checked {
        background-color: rgb(29, 155, 240);
        border-color: rgb(29, 155, 240);
    }
}

.check-icon {
    width: 20px;
    height: 20px;
    fill: rgb(255, 255, 255);
}
</style>
