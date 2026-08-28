import { LLM_PROTOCOLS, type LLMProtocol, type ProviderConfig } from '../../options/types';
import { openAICompatibleAdapter, openAIResponsesAdapter } from './openaiAdapter';
import { geminiInteractionsAdapter, geminiGenerateContentAdapter } from './geminiAdapter';
import { anthropicAdapter } from './anthropicAdapter';
import type { LLMAdapter, LLMRequest, LLMResponse } from './types';

export type { LLMMessage, LLMRequest, LLMResponse, LLMAdapter } from './types';

const adapters: Record<LLMProtocol, LLMAdapter> = {
  [LLM_PROTOCOLS.OPENAI_COMPATIBLE]: openAICompatibleAdapter,
  [LLM_PROTOCOLS.OPENAI_RESPONSES]: openAIResponsesAdapter,
  [LLM_PROTOCOLS.GEMINI_GENERATE_CONTENT]: geminiGenerateContentAdapter,
  [LLM_PROTOCOLS.GEMINI_INTERACTIONS]: geminiInteractionsAdapter,
  [LLM_PROTOCOLS.ANTHROPIC]: anthropicAdapter,
};

export function getLLMAdapter(protocol: ProviderConfig['protocol']): LLMAdapter {
  const adapter = adapters[protocol];
  if (!adapter) throw new Error(`暂不支持的 LLM 协议: ${protocol}`);
  return adapter;
}

export function requestLLM(config: ProviderConfig, request: LLMRequest): Promise<LLMResponse> {
  return getLLMAdapter(config.protocol).request(config, request);
}

export function testLLMProvider(config: ProviderConfig): Promise<void> {
  return getLLMAdapter(config.protocol).test(config);
}
