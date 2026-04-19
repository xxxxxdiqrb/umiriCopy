<script setup lang="ts">
import { appState } from '../store'
import { copyTweet } from '../composables/useCopyTweet'

const props = defineProps<{
  article: HTMLElement
}>()

const handleCopy = async () => {
  appState.loading.visible = true
  appState.loading.text = '正在复制'

  try {
    const copyString = await copyTweet(props.article)
    appState.actionBar.message = '资源获取完成'
    appState.actionBar.buttonText = '复制内容'
    appState.actionBar.handler = async () => {
      const type = 'text/html'
      const blob = new Blob([copyString], { type })
      const data = [new ClipboardItem({ [type]: blob })]
      await navigator.clipboard.write(data)
    }
    appState.actionBar.visible = true
  } catch (e) {
    appState.actionBar.message = '资源获取失败：' + String(e)
    appState.actionBar.buttonText = '确定'
    appState.actionBar.handler = null
    appState.actionBar.visible = true
  } finally {
    appState.loading.visible = false
  }
}
</script>

<template>
  <button class="copy-btn" @click="handleCopy">复制</button>
</template>

<style lang="scss" scoped>
.copy-btn {
  cursor: pointer;
  border: 1px solid rgb(53, 53, 53);
  z-index: 1000;
  line-height: 1.5;
  border-radius: 2px;
  position: absolute;
  background-color: white;
  padding: 2px 6px;
  bottom: 10px;
  left: 10px;
  font-size: 12px;
  color: rgb(53, 53, 53);
}
</style>
