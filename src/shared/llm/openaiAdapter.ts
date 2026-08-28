import type { ProviderConfig } from '../../options/types';
import { sendLLMRequest } from './transport';
import type { LLMAdapter, LLMRequest, LLMResponse } from './types';

function buildEndpoint(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path}`;
}

function parseParameter(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const numberValue = Number(value);
  return value !== '' && !Number.isNaN(numberValue) ? numberValue : value;
}

function getCustomParameters(config: ProviderConfig): Record<string, unknown> {
  return (config.customVariables || []).reduce<Record<string, unknown>>((parameters, variable) => {
    const name = variable.name.trim();
    if (name) parameters[name] = parseParameter(variable.value);
    return parameters;
  }, {});
}

function extractChatCompletionText(data: any): string {
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error('模型未返回有效文本内容');
  return text;
}

function extractResponseText(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text;

  const text = (data?.output || [])
    .flatMap((item: any) => item?.content || [])
    .filter((item: any) => item?.type === 'output_text' && typeof item.text === 'string')
    .map((item: any) => item.text)
    .join('');

  if (!text.trim()) throw new Error('模型未返回有效文本内容');
  return text;
}

async function testAdapter(adapter: LLMAdapter, config: ProviderConfig): Promise<void> {
  await adapter.request(config, {
    model: config.model,
    messages: [{ role: 'user', content: 'Hello' }],
  });
}

/** OpenAI-compatible Chat Completions protocol. */
export const openAICompatibleAdapter: LLMAdapter = {
  async request(config: ProviderConfig, request: LLMRequest): Promise<LLMResponse> {
    const body = {
      ...getCustomParameters(config),
      model: request.model,
      messages: request.messages,
      ...(request.jsonMode
        ? request.jsonSchema
          ? {
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'translation_result',
                  strict: true,
                  schema: request.jsonSchema,
                },
              },
            }
          : { response_format: { type: 'json_object' } }
        : {}),
      ...(request.parameters || {}),
      stream: false,
    };

    const data = await sendLLMRequest<any>(buildEndpoint(config.baseUrl, 'chat/completions'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    return { text: extractChatCompletionText(data), raw: data };
  },

  test(config: ProviderConfig): Promise<void> {
    return testAdapter(openAICompatibleAdapter, config);
  },
};

/** Native OpenAI Responses API protocol. */
export const openAIResponsesAdapter: LLMAdapter = {
  async request(config: ProviderConfig, request: LLMRequest): Promise<LLMResponse> {
    const systemMessages = request.messages.filter((message) => message.role === 'system');
    const input = request.messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role,
        content: [
          {
            type: message.role === 'assistant' ? 'output_text' : 'input_text',
            text: message.content,
          },
        ],
      }));
    const parameters = { ...getCustomParameters(config), ...(request.parameters || {}) };

    // response_format belongs to Chat Completions, so do not forward it to Responses.
    delete parameters.response_format;

    const body = {
      model: request.model,
      ...(systemMessages.length > 0
        ? { instructions: systemMessages.map((message) => message.content).join('\n') }
        : {}),
      input,
      ...(request.jsonMode
        ? request.jsonSchema
          ? {
              text: {
                format: {
                  type: 'json_schema',
                  name: 'translation_result',
                  strict: true,
                  schema: request.jsonSchema,
                },
              },
            }
          : { text: { format: { type: 'json_object' } } }
        : {}),
      ...parameters,
      stream: false,
    };

    const data = await sendLLMRequest<any>(buildEndpoint(config.baseUrl, 'responses'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    return { text: extractResponseText(data), raw: data };
  },

  test(config: ProviderConfig): Promise<void> {
    return testAdapter(openAIResponsesAdapter, config);
  },
};

/** Default OpenAI entry point remains Chat Completions for compatibility. */
export const openAIAdapter: LLMAdapter = openAICompatibleAdapter;
