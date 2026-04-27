<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import LoadingPanel from "../../shared/components/LoadingPanel.vue";
import ActionBar from "../../shared/components/ActionBar.vue";
import PreviewDialog from "../../shared/components/PreviewDialog.vue";
import Toast from "../../shared/components/Toast.vue";
import FloatingCopyButton from "../../shared/components/FloatingCopyButton.vue";
import SimpleConfigBar from "./components/SimpleConfigBar.vue";
import { handleDownloadVideo } from "./composables/videoHandler";

const isVideoPage = ref(false);
const showConfigBar = ref(false);

const checkVideoPage = () => {
  isVideoPage.value = /https:\/\/www\.tiktok\.com\/@[^/]+\/video\/\d+/.test(window.location.href);
};

let urlObserver: MutationObserver | null = null;

onMounted(() => {
  checkVideoPage();
  urlObserver = new MutationObserver(() => {
    checkVideoPage();
  });
  urlObserver.observe(document.body, { childList: true, subtree: true });
});

onUnmounted(() => {
  urlObserver?.disconnect();
});

const handleFloatingButtonClick = () => {
  showConfigBar.value = true;
};

const handleCancel = () => {
  showConfigBar.value = false;
};

const handleDownload = async () => {
  showConfigBar.value = false;
  await handleDownloadVideo();
};
</script>

<template>
  <Toast />
  <LoadingPanel />
  <ActionBar />
  <FloatingCopyButton label="下载" :visible="isVideoPage" @click="handleFloatingButtonClick" />
  <SimpleConfigBar :visible="showConfigBar" @cancel="handleCancel" @download="handleDownload" />
  <PreviewDialog />
</template>
