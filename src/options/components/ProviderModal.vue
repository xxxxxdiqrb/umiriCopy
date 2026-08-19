<script setup lang="ts">
import { ref, computed } from "vue";
import { DEFAULT_SYSTEM_MESSAGE, type ProviderConfig, type CustomVariable } from "../types";
import { BATCH_TRANSLATION_SYSTEM_MESSAGE, JSON_SYSTEM_MESSAGE } from "../../shared/constants";

const props = defineProps<{
  modelValue: boolean;
  provider: ProviderConfig | null;
  existingProviders: ProviderConfig[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [provider: ProviderConfig];
}>();

const isTesting = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

const formData = ref<ProviderConfig | null>(null);

const isEditing = computed(() => {
  if (!props.provider || !formData.value) return false;
  return props.existingProviders.some((p) => p.id === props.provider?.id);
});

const modalTitle = computed(() => (isEditing.value ? "编辑配置" : "添加配置"));

const closeModal = () => {
  emit("update:modelValue", false);
  testResult.value = null;
};

const parseValue = (value: string): string | number | boolean => {
  if (value === "true") return true;
  if (value === "false") return false;
  const num = Number(value);
  if (value !== "" && !isNaN(num)) return num;
  return value;
};

const buildCustomVarsObject = (vars: CustomVariable[]): Record<string, unknown> => {
  const obj: Record<string, unknown> = {};
  for (const v of vars) {
    if (v.name.trim()) {
      obj[v.name.trim()] = parseValue(v.value);
    }
  }
  return obj;
};

const getTestResponseContent = (data: any): string => {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("模型未返回有效内容");
  }
  return content;
};

const parseTestTranslationList = (content: string, expectedLength: number) => {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  const list = Array.isArray(parsed) ? parsed : parsed?.translations;
  if (!Array.isArray(list) || list.length !== expectedLength || list.some((item) => typeof item !== "string")) {
    throw new Error("模型返回的批量翻译格式不正确");
  }
};

const addVariable = () => {
  if (!formData.value) return;
  formData.value.customVariables.push({ name: "", value: "" });
};

const removeVariable = (index: number) => {
  if (!formData.value) return;
  formData.value.customVariables.splice(index, 1);
};

const resetDefaultPrompts = () => {
  if (!formData.value) return;
  formData.value.systemMessage = DEFAULT_SYSTEM_MESSAGE;
  formData.value.jsonSystemMessage = JSON_SYSTEM_MESSAGE;
};

const testConfig = async () => {
  if (!formData.value) return;

  isTesting.value = true;
  testResult.value = null;

  try {
    const { baseUrl, apiKey, model, systemMessage, jsonSystemMessage, customVariables, batchTranslation, enableJsonSchema } = formData.value;
    const customVars = buildCustomVarsObject(customVariables);
    const testContents = ["Hello", "Good morning"];
    const messages = batchTranslation
      ? [
          { role: "system", content: systemMessage },
          {
            role: "system",
            content: enableJsonSchema ? BATCH_TRANSLATION_SYSTEM_MESSAGE : jsonSystemMessage,
          },
          { role: "user", content: JSON.stringify(testContents) },
        ]
      : [
          { role: "system", content: systemMessage },
          { role: "user", content: testContents[0] },
        ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...customVars,
        model,
        messages,
        ...(batchTranslation && enableJsonSchema ? { response_format: { type: "json_object" } } : {}),
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const responseData = await response.json();
    const content = getTestResponseContent(responseData);
    if (batchTranslation) {
      parseTestTranslationList(content, testContents.length);
    }

    testResult.value = { success: true, message: "连接成功！配置有效。" };
  } catch (error) {
    testResult.value = {
      success: false,
      message: error instanceof Error ? error.message : "连接失败",
    };
  } finally {
    isTesting.value = false;
  }
};

const save = () => {
  if (!formData.value) return;
  emit("save", {
    ...formData.value,
    suffix: formData.value.suffix || "",
    batchTranslation: formData.value.batchTranslation ?? false,
    enableJsonSchema: Boolean(formData.value.batchTranslation && formData.value.enableJsonSchema),
    customVariables: [...formData.value.customVariables],
  });
  closeModal();
};

const onOpen = () => {
  if (props.provider) {
    const customVariables = props.provider.customVariables || [];
    formData.value = {
      ...props.provider,
      suffix: props.provider.suffix || "",
      batchTranslation: props.provider.batchTranslation ?? false,
      enableJsonSchema: props.provider.enableJsonSchema ?? false,
      customVariables: Object.values(customVariables).map((v) => ({ ...v })),
    };
  }
  testResult.value = null;
};

defineExpose({ onOpen });
</script>

<template>
  <div v-if="modelValue && formData" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ modalTitle }}</h2>
        <button class="btn-close" @click="closeModal">×</button>
      </div>
      <div class="modal-body">
        <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
          {{ testResult.message }}
        </div>
        <div class="form-group">
          <label>配置名称</label>
          <input v-model="formData.name" type="text" placeholder="如: DeepSeek" />
        </div>
        <div class="form-group">
          <label>API 地址</label>
          <input v-model="formData.baseUrl" type="text" placeholder="https://api.deepseek.com/v1" />
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
          <p class="field-description">指定翻译风格和内容处理规则</p>
          <textarea v-model="formData.systemMessage" rows="4"></textarea>
        </div>

        <div class="form-group">
          <label>附带后缀</label>
          <p class="field-description">翻译完成后自动追加在最后一行（如：由 DeepSeek 翻译）</p>
          <textarea v-model="formData.suffix" rows="2" placeholder="如：[由 AI 自动翻译] 或 自定义署名说明"></textarea>
        </div>

        <div class="form-group">
          <label>自定义参数 (如 temperature, stream 等)</label>
          <p class="field-description">为保证响应可被扩展解析，实际请求中的 stream 始终固定为 false。</p>
          <div class="custom-variables">
            <div v-for="(v, index) in formData.customVariables" :key="index" class="variable-row">
              <input v-model="v.name" type="text" placeholder="参数名 (如 temperature)" class="var-name" />
              <input v-model="v.value" type="text" placeholder="值 (如 1.3)" class="var-value" />
              <button class="btn-remove" @click="removeVariable(index)">×</button>
            </div>
            <button class="btn-add-var" @click="addVariable">+ 添加参数</button>
          </div>
        </div>

        <div class="form-group">
          <label>启用多条合并提交（批量请求）</label>
          <div class="toggle-row">
            <div>
              <p class="field-description">开启后合并提交多条文本；关闭时使用 Promise.all 逐条并发翻译。</p>
            </div>
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: formData.batchTranslation }"
              title="开启后批量翻译多条推文时将合并为一个请求"
              @click="formData.batchTranslation = !formData.batchTranslation"
            >
              <span class="toggle-indicator"></span>
            </button>
          </div>
        </div>

        <div v-if="formData.batchTranslation" class="form-group">
          <label>启用 JSON Schema 结构化输出</label>
          <div class="toggle-row">
            <div>
              <p class="field-description">使用 OpenAI 兼容的 response_format 参数约束批量输出。</p>
            </div>
            <button
              type="button"
              class="toggle-btn"
              :class="{ active: formData.enableJsonSchema }"
              title="启用 response_format (json_schema)，需要模型服务商支持"
              @click="formData.enableJsonSchema = !formData.enableJsonSchema"
            >
              <span class="toggle-indicator"></span>
            </button>
          </div>
        </div>

        <div v-if="formData.batchTranslation && !formData.enableJsonSchema" class="form-group">
          <label>JSON 格式约束</label>
          <p class="field-description">
            作为第二条 system message 发送给模型以约束输出为 JSON 数组。如果不清楚这段提示词的用途，请不要修改，以免批量翻译结果无法解析。
          </p>
          <textarea v-model="formData.jsonSystemMessage" rows="4"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" :disabled="isTesting" @click="testConfig">
          {{ isTesting ? "测试中..." : "测试连接" }}
        </button>
        <button class="btn btn-outline" @click="resetDefaultPrompts">恢复默认提示词</button>
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
  display: flex;
  flex-direction: column;
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 16px;
  width: 90%;
  max-width: 540px;
  max-height: 90vh;
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
  overflow: auto;
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

  .section-label {
    font-weight: 600;
    color: $text-primary;
  }

  input[type="text"],
  input[type="password"],
  input[type="number"],
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
      border-color: $text-primary;
    }

    &::placeholder {
      color: $text-secondary;
    }
  }

  textarea {
    resize: vertical;

    &[readonly] {
      color: $text-secondary;
      cursor: default;
    }
  }
}

.toggle-form-group {
  margin-bottom: 12px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  label {
    margin-bottom: 4px;
    color: $text-primary;
    font-weight: 600;
  }

  .field-description {
    margin-bottom: 0;
  }
}

.toggle-btn {
  position: relative;
  flex: 0 0 auto;
  width: 44px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 12px;
  background-color: #bbb;
  cursor: pointer;
  transition: background-color 0.2s;

  &.active {
    background-color: $text-primary;
  }
}

.toggle-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgb(239, 243, 244);
  transition: transform 0.2s;

  .toggle-btn.active & {
    transform: translateX(20px);
  }
}

.field-description {
  margin: -2px 0 8px;
  color: $text-secondary;
  font-size: 12px;
  line-height: 1.5;
}

.prompt-warning {
  margin: -2px 0 8px;
  color: $accent;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
}

.prompt-reset-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.custom-variables {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.variable-row {
  display: flex;
  gap: 8px;
  align-items: center;

  .var-name,
  .var-value {
    flex: 1;
    padding: 10px 12px;
    font-size: 15px;
    background: $bg-input;
    border: 1px solid $border-color;
    border-radius: 8px;
    color: $text-primary;
    outline: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

    &:focus {
      border-color: $accent;
    }

    &::placeholder {
      color: $text-secondary;
    }
  }
}

.btn-remove {
  background: none;
  border: none;
  color: $text-secondary;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    color: $danger;
    background: rgba($danger, 0.1);
  }
}

.btn-add-var {
  background: none;
  border: 1px dashed $border-color;
  color: $text-secondary;
  padding: 10px 12px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

  &:hover {
    border-color: $text-primary;
    color: $text-primary;
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
