<script setup lang="ts">
import { computed } from 'vue';
import LoadingPanel from '../components/LoadingPanel.vue';
import ActionBar from '../components/ActionBar.vue';
import PreviewDialog from '../components/PreviewDialog.vue';
import Toast from '../components/Toast.vue';
import FloatingCopyButton from '../components/FloatingCopyButton.vue';
import ConfigBar from '../components/ConfigBar.vue';
import { appState, refreshProvidersFromStorage } from '../store';
import { usePlatformCopy } from '../composables/usePlatformCopy';
import type { PlatformInstance } from './types';
import { executeVideoDownload } from '../composables/useVideoDownload';
import { exitPlatformSession } from './platformSession';

const props = defineProps<{ platform: PlatformInstance }>();
const definition = props.platform;
const configItems = computed(() => definition.configItems.value);
const { handleCancel, handleSubmit, handleUpdateItem } = usePlatformCopy({
  platformState: definition.state,
  updateConfig: definition.config.update,
  getSelectedArticleElements: definition.observer.getSelectedArticleElements,
  unmountAllSelectors: definition.observer.unmountAllSelectors,
  copyArticles: (articles, reporter) =>
    definition.copy?.execute(articles, reporter) ?? Promise.resolve(''),
  validateBeforeSubmit: () => definition.copy?.validate?.() ?? null,
});

const handleOpen = async () => {
  await refreshProvidersFromStorage();
  await definition.config.load();
  definition.state.configBar.visible = true;
  appState.selectMode.active = true;
  definition.observer.mountSelectorsToAllArticles();
};

const showDownloadVideo = computed(
  () =>
    definition.capabilities.videoDownload &&
    !!definition.video?.canDownload(definition.observer.getSelectedArticleElements()),
);
const handleDownloadVideo = async () => {
  if (!definition.video) return;
  const articles = definition.observer.getSelectedArticleElements();
  await executeVideoDownload({
    collectVideos: () => definition.video!.collectVideos(articles),
    onSuccess: () => exitPlatformSession(definition.state, definition.observer),
  });
};
const collectArticleData = async () => {
  const collector = definition.developerTools?.collectArticleData;
  if (!collector) return;
  for (const article of definition.observer.getSelectedArticleElements()) {
    try {
      console.log(`[${definition.id}] articleData`, await collector(article));
    } catch (error) {
      console.error(`[${definition.id}] 获取 articleData 失败`, error);
    }
  }
};
</script>

<template>
  <Toast />
  <LoadingPanel />
  <ActionBar />
  <FloatingCopyButton :label="definition.ui.floatingButtonLabel" visible @click="handleOpen" />
  <ConfigBar
    :visible="definition.state.configBar.visible"
    :items="configItems"
    :selected-count="appState.selectedArticles.size"
    :submit-label="definition.ui.submitLabel"
    :selected-count-label="definition.ui.selectedCountLabel"
    :show-download-video="showDownloadVideo"
    :show-developer-tools="definition.capabilities.developerTools && !!definition.developerTools"
    @cancel="handleCancel"
    @submit="handleSubmit"
    @update:item="handleUpdateItem"
    @download-video="handleDownloadVideo"
    @collect-article-data="collectArticleData"
  /><PreviewDialog />
</template>
