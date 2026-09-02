<script setup lang="ts">
import { computed } from 'vue';
import LoadingPanel from '../../shared/components/LoadingPanel.vue';
import ActionBar from '../../shared/components/ActionBar.vue';
import PreviewDialog from '../../shared/components/PreviewDialog.vue';
import Toast from '../../shared/components/Toast.vue';
import FloatingCopyButton from '../../shared/components/FloatingCopyButton.vue';
import ConfigBar from '../../shared/components/ConfigBar.vue';
import { appState, refreshProvidersFromStorage } from '../../shared/store';
import { usePlatformCopy } from '../../shared/composables/usePlatformCopy';
import { platformState, configItems, updateConfig, observer, loadPlatformConfig } from './platform';
import { executeCopyPipeline } from '../../shared/copy/pipeline';
import { twitterAdapter } from './adapter';
import type { TranslationOptions } from '../../shared/utils';
import type { CopyPipelineOptions } from '../../shared/copy/types';
import { handleDownloadVideo } from './composables/videoHandler';
import { collectArticleData } from './collectors/tweetArticleCollector';

function readTweetCopyOptions(): CopyPipelineOptions {
  return {
    translate: platformState.configBar.translate,
    captureScreenshot: platformState.configBar.captureScreenshot,
    copyImages: platformState.configBar.copyImages,
    getAlt: platformState.configBar.getAlt,
    download: platformState.configBar.download,
    suffix: appState.options.suffix,
  };
}

function readTranslationOptions(): TranslationOptions {
  return {
    ...appState.options,
    customVariables: Object.entries(appState.options.otherParam).map(([name, value]) => ({
      name,
      value: String(value),
    })),
  };
}

const { handleCancel, handleSubmit, handleUpdateItem } = usePlatformCopy({
  platformState,
  updateConfig,
  getSelectedArticleElements: observer.getSelectedArticleElements,
  unmountAllSelectors: observer.unmountAllSelectors,
  copyArticles: (articles, reportLoadingText) =>
    executeCopyPipeline(
      articles,
      twitterAdapter,
      readTweetCopyOptions(),
      readTranslationOptions(),
      reportLoadingText,
    ),
  validateBeforeSubmit: () => {
    if (platformState.configBar.translate) {
      const selectedProvider = appState.providers.find(
        (p) => p.id === platformState.configBar.selectedProviderId,
      );
      if (!selectedProvider || !selectedProvider.apiKey) {
        return '请先进行翻译配置';
      }
    }
    return null;
  },
});

const handleFloatingButtonClick = async () => {
  await refreshProvidersFromStorage();
  await loadPlatformConfig();
  platformState.configBar.visible = true;
  appState.selectMode.active = true;
  observer.mountSelectorsToAllArticles();
};

const showDownloadVideo = computed(() => {
  if (appState.selectedArticles.size !== 1) {
    return false;
  }
  const selectedArticles = observer.getSelectedArticleElements();
  const article = selectedArticles[0];
  const mediaContainer = article.querySelector('div[aria-labelledby]')?.children?.[0];
  const hasVideo = mediaContainer?.querySelector('video') != null;
  const isNotQuoted = mediaContainer?.querySelector('time') == null;
  return hasVideo && isNotQuoted;
});

const collectSelectedArticleData = async () => {
  const articles = observer.getSelectedArticleElements();
  if (articles.length === 0) {
    console.warn('[tweetCopy] 请先选择一条推文');
    return;
  }
  for (const article of articles) {
    try {
      const articleData = await collectArticleData(article, {
        ...readTweetCopyOptions(),
        copyImages: true,
        getAlt: true,
      });
      console.log('[tweetCopy] articleData', articleData);
    } catch (error) {
      console.error('[tweetCopy] 获取 articleData 失败', error);
    }
  }
};
</script>

<template>
  <Toast />
  <LoadingPanel />
  <ActionBar />
  <FloatingCopyButton label="复制" visible @click="handleFloatingButtonClick" />
  <ConfigBar
    :visible="platformState.configBar.visible"
    :items="configItems"
    :selected-count="appState.selectedArticles.size"
    submit-label="复制"
    selected-count-label="已选中推文"
    :show-download-video="showDownloadVideo"
    :show-developer-tools="appState.options.developerMode"
    @cancel="handleCancel"
    @submit="handleSubmit"
    @update:item="handleUpdateItem"
    @download-video="handleDownloadVideo"
    @collect-article-data="collectSelectedArticleData"
  />
  <PreviewDialog />
</template>
