<script setup lang="ts">
import LoadingPanel from '../../shared/components/LoadingPanel.vue'
import ActionBar from '../../shared/components/ActionBar.vue'
import PreviewDialog from '../../shared/components/PreviewDialog.vue'
import Toast from '../../shared/components/Toast.vue'
import FloatingCopyButton from '../../shared/components/FloatingCopyButton.vue'
import ConfigBar from '../../shared/components/ConfigBar.vue'
import { appState, refreshProvidersFromStorage } from '../../shared/store'
import { usePlatformCopy } from '../../shared/composables/usePlatformCopy'
import { platformState, configItems, updateConfig, observer } from './platform'
import { copyTweet } from './composables/useCopyTweet'

const { handleCancel, handleSubmit, handleUpdateItem } = usePlatformCopy({
  platformState,
  updateConfig,
  getSelectedArticleElements: observer.getSelectedArticleElements,
  unmountAllSelectors: observer.unmountAllSelectors,
  copyArticles: copyTweet,
  validateBeforeSubmit: () => {
    if (platformState.configBar.translate) {
      const selectedProvider = appState.providers.find(
        (p) => p.id === platformState.configBar.selectedProviderId
      )
      if (!selectedProvider || !selectedProvider.apiKey) {
        return '请先进行翻译配置'
      }
    }
    return null
  },
})

const handleFloatingButtonClick = async () => {
  await refreshProvidersFromStorage()
  platformState.configBar.visible = true
  appState.selectMode.active = true
  observer.mountSelectorsToAllArticles()
}
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
    selected-count-label="已选中推文"
    @cancel="handleCancel"
    @submit="handleSubmit"
    @update:item="handleUpdateItem"
  />
  <PreviewDialog />
</template>
