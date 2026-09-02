import { JSON_SYSTEM_MESSAGE } from '../shared/constants';

export interface CustomVariable {
  name: string;
  value: string;
}

export const LLM_PROVIDERS = {
  OPENAI: 'openai',
  OPENAI_COMPATIBLE: 'openai-compatible',
  GEMINI: 'gemini',
  ANTHROPIC: 'anthropic',
} as const;

export const LLM_PROTOCOLS = {
  OPENAI_COMPATIBLE: 'openai-compatible',
  OPENAI_RESPONSES: 'openai-responses',
  GEMINI_GENERATE_CONTENT: 'gemini-generate-content',
  GEMINI_INTERACTIONS: 'gemini-interactions',
  ANTHROPIC: 'anthropic',
} as const;
export type LLMProtocol = (typeof LLM_PROTOCOLS)[keyof typeof LLM_PROTOCOLS];

export type LLMProvider = (typeof LLM_PROVIDERS)[keyof typeof LLM_PROVIDERS];

export interface ProviderConfig {
  id: string;
  name: string;
  provider: LLMProvider;
  protocol: LLMProtocol;
  baseUrl: string;
  apiKey: string;
  model: string;
  systemMessage: string;
  jsonSystemMessage: string;
  suffix?: string;
  customVariables: CustomVariable[];
  batchTranslation: boolean;
  enableJsonSchema: boolean;
}

export interface PlatformSettings {
  translate: boolean;
  copyImages: boolean;
  download: boolean;
  captureScreenshot?: boolean;
  getAlt?: boolean;
  providerId?: string | null;
}

export interface PlatformConfigs {
  twitter: PlatformSettings;
  instagram: PlatformSettings;
}

export interface OptionsData {
  providers: ProviderConfig[];
  defaultProviderId: string | null;
  developerMode: boolean;
  platformConfigs?: PlatformConfigs;
}

export interface ExportedOptionsData {
  version: string;
  exportedAt: string;
  data: OptionsData;
}

export const DEFAULT_PLATFORM_CONFIGS: PlatformConfigs = {
  twitter: {
    translate: true,
    captureScreenshot: true,
    copyImages: true,
    download: false,
    getAlt: false,
    providerId: null,
  },
  instagram: {
    translate: true,
    copyImages: true,
    download: false,
    providerId: null,
  },
};

export const DEFAULT_SYSTEM_MESSAGE =
  '将提供的推特内容翻译为中文，只翻译原文，不要加入任何的注释和说明，保留原文的emoji、hashtag与特殊字符';

export const createDefaultProvider = (): ProviderConfig => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  name: 'DeepSeek',
  provider: LLM_PROVIDERS.OPENAI,
  protocol: LLM_PROTOCOLS.OPENAI_COMPATIBLE,
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-v4-flash',
  systemMessage: DEFAULT_SYSTEM_MESSAGE,
  jsonSystemMessage: JSON_SYSTEM_MESSAGE,
  suffix: '【由 deepseek-v4-flash 翻译，仅供参考】',
  batchTranslation: true,
  enableJsonSchema: true,
  customVariables: [{ name: 'stream', value: 'false' }],
});

export function normalizeProviderConfig(provider: Partial<ProviderConfig>): ProviderConfig {
  const defaults = createDefaultProvider();
  const customVariables: CustomVariable[] = [];

  if (Array.isArray(provider.customVariables)) {
    for (const item of provider.customVariables) {
      if (item && typeof item === 'object' && 'name' in item && 'value' in item) {
        customVariables.push({
          name: String(item.name ?? ''),
          value: String(item.value ?? ''),
        });
      }
    }
  } else {
    customVariables.push(...defaults.customVariables.map((v) => ({ ...v })));
  }

  return {
    id: typeof provider.id === 'string' && provider.id.trim() ? provider.id : defaults.id,
    name: typeof provider.name === 'string' && provider.name.trim() ? provider.name : defaults.name,
    provider:
      provider.provider === LLM_PROVIDERS.OPENAI_COMPATIBLE
        ? LLM_PROVIDERS.OPENAI
        : Object.values(LLM_PROVIDERS).includes(provider.provider as LLMProvider)
          ? (provider.provider as LLMProvider)
          : defaults.provider,
    protocol: Object.values(LLM_PROTOCOLS).includes(provider.protocol as LLMProtocol)
      ? (provider.protocol as LLMProtocol)
      : provider.provider === LLM_PROVIDERS.OPENAI_COMPATIBLE
        ? LLM_PROTOCOLS.OPENAI_COMPATIBLE
        : defaults.protocol,
    baseUrl: typeof provider.baseUrl === 'string' ? provider.baseUrl : defaults.baseUrl,
    apiKey: typeof provider.apiKey === 'string' ? provider.apiKey : defaults.apiKey,
    model: typeof provider.model === 'string' ? provider.model : defaults.model,
    systemMessage:
      typeof provider.systemMessage === 'string' ? provider.systemMessage : defaults.systemMessage,
    jsonSystemMessage:
      typeof provider.jsonSystemMessage === 'string'
        ? provider.jsonSystemMessage
        : defaults.jsonSystemMessage,
    suffix: typeof provider.suffix === 'string' ? provider.suffix : defaults.suffix || '',
    batchTranslation:
      typeof provider.batchTranslation === 'boolean'
        ? provider.batchTranslation
        : defaults.batchTranslation,
    enableJsonSchema:
      (typeof provider.batchTranslation === 'boolean'
        ? provider.batchTranslation
        : defaults.batchTranslation) &&
      (typeof provider.enableJsonSchema === 'boolean'
        ? provider.enableJsonSchema
        : defaults.enableJsonSchema),
    customVariables,
  };
}

export function normalizePlatformSettings(
  settings: Partial<PlatformSettings> | undefined,
  fallback: PlatformSettings,
): PlatformSettings {
  return {
    translate: typeof settings?.translate === 'boolean' ? settings.translate : fallback.translate,
    copyImages:
      typeof settings?.copyImages === 'boolean' ? settings.copyImages : fallback.copyImages,
    download: typeof settings?.download === 'boolean' ? settings.download : fallback.download,
    getAlt: typeof settings?.getAlt === 'boolean' ? settings.getAlt : fallback.getAlt,
    captureScreenshot:
      fallback.captureScreenshot !== undefined
        ? typeof settings?.captureScreenshot === 'boolean'
          ? settings.captureScreenshot
          : fallback.captureScreenshot
        : undefined,
    providerId:
      typeof settings?.providerId === 'string' || settings?.providerId === null
        ? settings.providerId
        : fallback.providerId,
  };
}

export function sanitizeOptionsData(raw: unknown): OptionsData {
  if (!raw || typeof raw !== 'object') {
    return {
      providers: [],
      defaultProviderId: null,
      developerMode: false,
      platformConfigs: { ...DEFAULT_PLATFORM_CONFIGS },
    };
  }

  const obj = raw as Record<string, unknown>;
  const rawData = (
    obj.data && typeof obj.data === 'object' ? obj.data : obj
  ) as Partial<OptionsData>;

  let providers: ProviderConfig[] = [];
  if (Array.isArray(rawData.providers)) {
    providers = rawData.providers.map((p) => normalizeProviderConfig(p || {}));
  } else if (rawData.providers && typeof rawData.providers === 'object') {
    providers = Object.values(rawData.providers).map((p) =>
      normalizeProviderConfig((p as Partial<ProviderConfig>) || {}),
    );
  }

  const rawPlatformConfigs = (rawData.platformConfigs || {}) as Partial<PlatformConfigs>;
  const platformConfigs: PlatformConfigs = {
    twitter: normalizePlatformSettings(
      rawPlatformConfigs.twitter,
      DEFAULT_PLATFORM_CONFIGS.twitter,
    ),
    instagram: normalizePlatformSettings(
      rawPlatformConfigs.instagram,
      DEFAULT_PLATFORM_CONFIGS.instagram,
    ),
  };

  const defaultProviderId =
    typeof rawData.defaultProviderId === 'string' &&
    providers.some((p) => p.id === rawData.defaultProviderId)
      ? rawData.defaultProviderId
      : (providers[0]?.id ?? null);

  return {
    providers,
    defaultProviderId,
    developerMode: rawData.developerMode === true,
    platformConfigs,
  };
}
