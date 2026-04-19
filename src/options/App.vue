<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface OptionsData {
  baseUrl: string
  apiKey: string
  model: string
  otherParam: {
    temperature: number
    stream: boolean
  }
  systemMessage: string
  [key: string]: unknown
}

const defaultData: OptionsData = {
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  otherParam: {
    temperature: 1.3,
    stream: false
  },
  systemMessage:
    '发送的所有日语语言的消息均要求翻译为简体中文，不要加入任何的注释、延伸、翻译注解和翻译说明，也不要加入回应。标签不用翻译，原文如果有emoji表情请保留。请一直遵守这条规则，直到发出终止指令为止。'
}

const isEdit = ref(false)
const optionText = ref('')
const savedData = ref<OptionsData>({} as OptionsData)

onMounted(async () => {
  const result = await chrome.storage.local.get('options')
  savedData.value = result.options || {}
  optionText.value = JSON.stringify(savedData.value, null, 4)
})

const startEdit = () => {
  isEdit.value = true
}

const cancelEdit = () => {
  optionText.value = JSON.stringify(savedData.value, null, 4)
  isEdit.value = false
}

const submitEdit = async () => {
  const newData = JSON.parse(optionText.value)
  optionText.value = JSON.stringify(newData, null, 4)
  savedData.value = newData
  await chrome.storage.local.set({ options: newData })
  isEdit.value = false
}

const setDefault = () => {
  optionText.value = JSON.stringify(defaultData, null, 4)
}
</script>

<template>
  <div class="container">
    <div class="toolbar">
      <button v-if="!isEdit" class="btn" @click="startEdit">编辑</button>
      <template v-else>
        <button class="btn" @click="cancelEdit">取消</button>
        <button class="btn" @click="submitEdit">确定</button>
        <button class="btn" @click="setDefault">默认值</button>
      </template>
    </div>
    <textarea
      v-model="optionText"
      :disabled="!isEdit"
      class="option-textarea"
    ></textarea>
  </div>
</template>

<style lang="scss" scoped>
.container {
  padding: 12px;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.btn {
  padding: 2px 8px;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;

  &:hover {
    background: #f5f5f5;
  }
}

.option-textarea {
  width: 100%;
  flex: 1;
  resize: none;
  padding: 10px;
  font-size: 16px;
  font-family: monospace;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;

  &:disabled {
    background-color: #f9f9f9;
    cursor: not-allowed;
  }

  &:not(:disabled):focus {
    border-color: #1a73e8;
  }
}
</style>
