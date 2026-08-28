import type { ProviderConfig } from "../../options/types";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  jsonMode?: boolean;
  jsonSchema?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
}

export interface LLMResponse {
  text: string;
  raw?: unknown;
}

export interface LLMAdapter {
  request(config: ProviderConfig, request: LLMRequest): Promise<LLMResponse>;
  test(config: ProviderConfig): Promise<void>;
}
