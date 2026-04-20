<script setup lang="ts">
import LoadingPanel from './components/LoadingPanel.vue'
import ActionBar from './components/ActionBar.vue'
import FloatingCopyButton from './components/FloatingCopyButton.vue'
import ConfigBar from './components/ConfigBar.vue'
import PreviewDialog from './components/PreviewDialog.vue'
import Toast from './components/Toast.vue'
</script>

<template>
  <Toast />
  <LoadingPanel />
  <ActionBar />
  <FloatingCopyButton />
  <ConfigBar />
  <PreviewDialog />
</template>
