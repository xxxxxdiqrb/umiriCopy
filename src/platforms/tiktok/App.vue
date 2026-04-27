<script setup lang="ts">
import { computed } from "vue";
import LoadingPanel from "../../shared/components/LoadingPanel.vue";
import ActionBar from "../../shared/components/ActionBar.vue";
import PreviewDialog from "../../shared/components/PreviewDialog.vue";
import Toast from "../../shared/components/Toast.vue";
import FloatingCopyButton from "../../shared/components/FloatingCopyButton.vue";
import ConfigBar from "../../shared/components/ConfigBar.vue";
import { appState } from "../../shared/store";
import { usePlatformCopy } from "../../shared/composables/usePlatformCopy";
import { platformState, configItems, updateConfig, observer } from "./platform";
import { handleDownloadVideo } from "./composables/videoHandler";

const { handleCancel, handleSubmit, handleUpdateItem } = usePlatformCopy({
  platformState,
  updateConfig,
  getSelectedArticleElements: observer.getSelectedArticleElements,
  unmountAllSelectors: observer.unmountAllSelectors,
  copyArticles: async () => {
    // TODO: 实现复制功能
  },
});

const handleFloatingButtonClick = async () => {
  platformState.configBar.visible = true;
  appState.selectMode.active = true;
  observer.mountSelectorsToAllArticles();
};

const showDownloadVideo = computed(() => {
  return appState.selectedArticles.size === 1;
});
</script>

<template>
  <Toast />
  <LoadingPanel />
  <ActionBar />
  <FloatingCopyButton label="复制" @click="handleFloatingButtonClick" />
  <ConfigBar
    :visible="platformState.configBar.visible"
    :items="configItems"
    :selected-count="appState.selectedArticles.size"
    submit-label="复制"
    selected-count-label="已选中视频"
    :show-download-video="showDownloadVideo"
    @cancel="handleCancel"
    @submit="handleSubmit"
    @update:item="handleUpdateItem"
    @download-video="handleDownloadVideo"
  />
  <PreviewDialog />
</template>
