<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProviderConfig } from '../types'

const props = defineProps<{
  modelValue: boolean
  provider: ProviderConfig | null
  existingProviders: ProviderConfig[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [provider: ProviderConfig]
}>()

const isTesting = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

const formData = ref<ProviderConfig | null>(null)

const isEditing = computed(() => {
  if (!props.provider || !formData.value) return false
  return props.existingProviders.some(p => p.id === props.provider?.id)
})

const modalTitle = computed(() => (isEditing.value ? '编辑配置' : '添加配置'))

const closeModal = () => {
  emit('update:modelValue', false)
  testResult.value = null
}

const testConfig = async () => {
  if (!formData.value) return

  isTesting.value = true
  testResult.value = null

  try {
    const { baseUrl, apiKey, model, systemMessage, temperature, stream, maxTokens, topP } =
      formData.value

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: '测试连接' }
        ],
        temperature,
        stream,
        max_tokens: maxTokens,
        top_p: topP
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP ${response.status}`)
    }

    if (stream) {
      const reader = response.body?.getReader()
      if (reader) {
        await reader.read()
        reader.cancel()
      }
    } else {
      await response.json()
    }

    testResult.value = { success: true, message: '连接成功！配置有效。' }
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : '连接失败'
    }
  } finally {
    isTesting.value = false
  }
}

const save = () => {
  if (!formData.value) return
  emit('save', { ...formData.value })
  closeModal()
}

const onOpen = () => {
  if (props.provider) {
    formData.value = { ...props.provider }
  }
  testResult.value = null
}

defineExpose({ onOpen })
</script>

<template>
  <div v-if="modelValue && formData" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button class="btn-close" @click="closeModal">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>配置名称</label>
          <input v-model="formData.name" type="text" placeholder="如: DeepSeek" />
        </div>
        <div class="form-group">
          <label>API 地址</label>
          <input
            v-model="formData.baseUrl"
            type="text"
            placeholder="https://api.deepseek.com/v1"
          />
        </div>
        <div class="form-group">
          <label>API Key</label>
          <input v-model="formData.apiKey" type="password" placeholder="sk-xxxxxxxx" />
        </div>
        <div class="form-group">
          <label>模型</label>
          <input v-model="formData.model" type="text" placeholder="deepseek-chat" />
        </div>
        <div class="form-group">
          <label>System Message</label>
          <textarea v-model="formData.systemMessage" rows="4"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Temperature</label>
            <input
              v-model.number="formData.temperature"
              type="number"
              step="0.1"
              min="0"
              max="2"
            />
          </div>
          <div class="form-group">
            <label>Top P</label>
            <input
              v-model.number="formData.topP"
              type="number"
              step="0.1"
              min="0"
              max="1"
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Max Tokens</label>
            <input v-model.number="formData.maxTokens" type="number" min="1" />
          </div>
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="formData.stream" type="checkbox" />
              启用 Stream
            </label>
          </div>
        </div>

        <div
          v-if="testResult"
          class="test-result"
          :class="testResult.success ? 'success' : 'error'"
        >
          {{ testResult.message }}
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" @click="testConfig" :disabled="isTesting">
          {{ isTesting ? '测试中...' : '测试连接' }}
        </button>
        <button class="btn btn-outline" @click="closeModal">取消</button>
        <button class="btn btn-primary" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$bg-white: rgb(255, 255, 255);
$bg-input: rgb(247, 249, 249);
$border-color: rgb(239, 243, 244);
$text-primary: rgb(15, 20, 25);
$text-secondary: rgb(113, 118, 123);
$accent: rgb(29, 155, 240);
$accent-hover: rgb(26, 140, 216);
$success: rgb(0, 186, 124);
$danger: rgb(244, 33, 46);

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid $border-color;

  h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: $text-primary;
  }
}

.btn-close {
  background: none;
  border: none;
  color: $text-primary;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;

  &:hover {
    color: $accent;
  }
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: $text-secondary;
    margin-bottom: 6px;
  }

  input[type='text'],
  input[type='password'],
  input[type='number'],
  textarea {
    width: 100%;
    padding: 10px 12px;
    font-size: 15px;
    background: $bg-input;
    border: 1px solid $border-color;
    border-radius: 8px;
    color: $text-primary;
    outline: none;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

    &:focus {
      border-color: $accent;
    }

    &::placeholder {
      color: $text-secondary;
    }
  }

  textarea {
    resize: vertical;
  }
}

.form-row {
  display: flex;
  gap: 16px;

  .form-group {
    flex: 1;
  }
}

.checkbox-group {
  display: flex;
  align-items: flex-end;
  padding-bottom: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: $text-primary;
  font-size: 14px;
  margin: 0;

  input[type='checkbox'] {
    width: 18px;
    height: 18px;
    accent-color: $accent;
  }
}

.test-result {
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;

  &.success {
    background: rgba($success, 0.1);
    color: $success;
    border: 1px solid rgba($success, 0.3);
  }

  &.error {
    background: rgba($danger, 0.1);
    color: $danger;
    border: 1px solid rgba($danger, 0.3);
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid $border-color;
}

.btn {
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 9999px;
  background: transparent;
  transition: background-color 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-outline {
  border: 1px solid $text-primary;
  color: $text-primary;

  &:hover:not(:disabled) {
    background: rgba(15, 20, 25, 0.1);
  }
}

.btn-primary {
  border: none;
  color: rgb(255, 255, 255);
  background: $text-primary;

  &:hover:not(:disabled) {
    background: rgb(39, 44, 48);
  }
}
</style>