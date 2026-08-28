import type { ProviderConfig } from "../../options/types";
import { sendLLMRequest } from "./transport";
import type { LLMAdapter, LLMRequest, LLMResponse } from "./types";

function buildEndpoint(baseUrl: string): string {
  const root = baseUrl.replace(/\/+$/, "").replace(/\/interactions$/, "");
  return `${root}/interactions`;
}

function parseParameter(value: string): string | number | boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  const numeric = Number(value);
  return value !== "" && !Number.isNaN(numeric) ? numeric : value;
}

function customParameters(config: ProviderConfig): Record<string, unknown> {
  return (config.customVariables || []).reduce<Record<string, unknown>>((parameters, variable) => {
    const name = variable.name.trim();
    if (name) parameters[name] = parseParameter(variable.value);
    return parameters;
  }, {});
}

function extractText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text;
  const text = (data?.steps || [])
    .flatMap((step: any) => step?.content || [])
    .filter((part: any) => typeof part?.text === "string")
    .map((part: any) => part.text)
    .join("");
  if (!text.trim()) throw new Error("模型未返回有效文本内容");
  return text;
}

export const geminiInteractionsAdapter: LLMAdapter = {
  async request(config: ProviderConfig, request: LLMRequest): Promise<LLMResponse> {
    const system = request.messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n");
    const messages = request.messages.filter((message) => message.role !== "system");
    const input =
      messages.length === 1 && messages[0].role === "user"
        ? messages[0].content
        : messages.map((message) => ({
            type: message.role === "assistant" ? "model_output" : "user_input",
            content: [{ type: "text", text: message.content }],
          }));
    const parameters = { ...customParameters(config), ...(request.parameters || {}) };
    const generationConfig = (parameters.generation_config || {}) as Record<string, unknown>;
    delete parameters.generation_config;
    delete parameters.response_format;

    const body = {
      model: request.model,
      input,
      ...(system ? { system_instruction: system } : {}),
      ...(Object.keys({ ...parameters, ...generationConfig }).length > 0 ? { generation_config: { ...parameters, ...generationConfig } } : {}),
      ...(request.jsonMode
        ? { response_format: { type: "text", mime_type: "application/json", ...(request.jsonSchema ? { schema: request.jsonSchema } : {}) } }
        : {}),
    };
    const data = await sendLLMRequest<any>(buildEndpoint(config.baseUrl || "https://generativelanguage.googleapis.com/v1beta"), {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": config.apiKey },
      body: JSON.stringify(body),
    });
    return { text: extractText(data), raw: data };
  },

  async test(config: ProviderConfig): Promise<void> {
    await this.request(config, { model: config.model, messages: [{ role: "user", content: "Hello" }] });
  },
};

function generateContentEndpoint(baseUrl: string, model: string): string {
  const root = baseUrl.replace(/\/+$/, "").replace(/\/models(?:\/[^/]+)?$/, "");
  return `${root}/models/${encodeURIComponent(model)}:generateContent`;
}

/** Gemini's legacy Generative Language API. */
export const geminiGenerateContentAdapter: LLMAdapter = {
  async request(config: ProviderConfig, request: LLMRequest): Promise<LLMResponse> {
    const system = request.messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n");
    const contents = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));
    const generationConfig = { ...customParameters(config), ...(request.parameters || {}) };
    delete (generationConfig as any).response_format;
    delete (generationConfig as any).generationConfig;
    const body = {
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents,
      generationConfig: {
        ...generationConfig,
        ...(request.jsonMode ? { responseMimeType: "application/json", ...(request.jsonSchema ? { responseSchema: request.jsonSchema } : {}) } : {}),
      },
    };
    const data = await sendLLMRequest<any>(
      generateContentEndpoint(config.baseUrl || "https://generativelanguage.googleapis.com/v1beta", request.model),
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": config.apiKey },
        body: JSON.stringify(body),
      },
    );
    const text = data?.candidates
      ?.flatMap((candidate: any) => candidate?.content?.parts || [])
      .filter((part: any) => typeof part?.text === "string")
      .map((part: any) => part.text)
      .join("");
    if (!text?.trim()) throw new Error("模型未返回有效文本内容");
    return { text, raw: data };
  },

  async test(config: ProviderConfig): Promise<void> {
    await this.request(config, { model: config.model, messages: [{ role: "user", content: "Hello" }] });
  },
};
