<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isTranslate = ref(true)

const openOptions = () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage()
  } else {
    window.open(chrome.runtime.getURL('options/options.html'))
  }
}

onMounted(async () => {
  const result = await chrome.storage.local.get('textCopyType')
  if (result.textCopyType !== undefined) {
    isTranslate.value = result.textCopyType
  }
})

const handleChange = async () => {
  await chrome.storage.local.set({ textCopyType: isTranslate.value })
}
</script>

<template>
  <div class="container">
    <p class="title">文本复制方式</p>
    <div class="input-container">
      <input type="checkbox" id="textCopy" v-model="isTranslate" @change="handleChange" />
      <label for="textCopy">翻译</label>
    </div>
    <p class="option-btn" @click="openOptions">翻译配置</p>
  </div>
</template>

<style lang="scss" scoped>
.container {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  width: fit-content;
}

.title {
  white-space: nowrap;
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 1.5;
}

.input-container {
  display: flex;
  align-items: center;
  margin-bottom: 6px;

  label {
    padding-left: 4px;
    user-select: none;
    font-size: 14px;
    line-height: 1.5;
  }
}

.option-btn {
  user-select: none;
  color: #1a73e8;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.5;

  &:hover {
    text-decoration: underline;
  }
}
</style>
