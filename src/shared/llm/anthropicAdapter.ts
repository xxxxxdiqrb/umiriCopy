import type { ProviderConfig } from "../../options/types";
import { sendLLMRequest } from "./transport";
import type { LLMAdapter, LLMRequest, LLMResponse } from "./types";

function endpoint(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, "")}/messages`;
}

function textOf(data: any): string {
  const text = data?.content?.filter((p: any) => p?.type === "text").map((p: any) => p.text).join("");
  if (typeof text !== "string" || !text.trim()) throw new Error("模型未返回有效文本内容");
  return text;
}

function customParameters(config: ProviderConfig): Record<string, unknown> {
  return (config.customVariables || []).reduce<Record<string, unknown>>((parameters, variable) => {
    const name = variable.name.trim();
    if (!name) return parameters;
    const value = variable.value;
    parameters[name] = value === "true" ? true : value === "false" ? false : value !== "" && !Number.isNaN(Number(value)) ? Number(value) : value;
    return parameters;
  }, {});
}

export const anthropicAdapter: LLMAdapter = {
  async request(config: ProviderConfig, request: LLMRequest): Promise<LLMResponse> {
    const system = request.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
    const messages = request.messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    const parameters = { ...customParameters(config), ...(request.parameters || {}) } as Record<string, unknown>;
    delete parameters.response_format;
    delete parameters.output_config;
    const data = await sendLLMRequest<any>(endpoint(config.baseUrl || "https://api.anthropic.com/v1"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: parameters.max_tokens ?? 4096,
        ...(system ? { system } : {}),
        messages,
        ...(request.jsonMode && request.jsonSchema ? { output_config: { format: { type: "json_schema", schema: request.jsonSchema } } } : {}),
        ...parameters,
      }),
    });
    return { text: textOf(data), raw: data };
  },
  async test(config) {
    await this.request(config, { model: config.model, messages: [{ role: "user", content: "Hello" }] });
  },
};
