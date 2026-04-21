export interface CustomVariable {
  name: string;
  value: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  systemMessage: string;
  customVariables: CustomVariable[];
}

export interface OptionsData {
  providers: ProviderConfig[];
  defaultProviderId: string | null;
}

export const DEFAULT_SYSTEM_MESSAGE =
  "发送的所有日语语言的消息均要求翻译为简体中文，不要加入任何的注释、延伸、翻译注解和翻译说明，也不要加入回应。标签不用翻译，原文如果有emoji表情请保留。请一直遵守这条规则，直到发出终止指令为止。";

export const createDefaultProvider = (): ProviderConfig => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: "DeepSeek",
  baseUrl: "https://api.deepseek.com/v1",
  apiKey: "",
  model: "deepseek-chat",
  systemMessage: DEFAULT_SYSTEM_MESSAGE,
  customVariables: [
    { name: "temperature", value: "1.3" },
    { name: "stream", value: "false" },
  ],
});
