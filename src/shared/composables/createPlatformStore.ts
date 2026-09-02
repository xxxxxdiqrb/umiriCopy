import { reactive, computed } from 'vue';
import { appState, applyProvider } from '../store';
import { DEFAULT_PLATFORM_CONFIGS, type PlatformSettings } from '../../options/types';
import type { ConfigItem } from '../types';
import type { PlatformStoreOptions } from '../platform/types';

export interface PlatformState {
  configBar: {
    visible: boolean;
    translate: boolean;
    captureScreenshot: boolean;
    copyImages: boolean;
    download: boolean;
    getAlt: boolean;
    selectedProviderId: string | null;
  };
}

export async function getPlatformSettingsFromStorage(
  platform: string,
  fallbackDefaults: PlatformSettings = DEFAULT_PLATFORM_CONFIGS.twitter,
): Promise<PlatformSettings> {
  try {
    const stored = (await chrome.storage.local.get('options'))?.options;
    const platformConfig = stored?.platformConfigs?.[platform];
    if (platformConfig && typeof platformConfig === 'object') {
      return {
        translate:
          typeof platformConfig.translate === 'boolean'
            ? platformConfig.translate
            : fallbackDefaults.translate,
        copyImages:
          typeof platformConfig.copyImages === 'boolean'
            ? platformConfig.copyImages
            : fallbackDefaults.copyImages,
        download:
          typeof platformConfig.download === 'boolean'
            ? platformConfig.download
            : fallbackDefaults.download,
        getAlt:
          typeof platformConfig.getAlt === 'boolean'
            ? platformConfig.getAlt
            : fallbackDefaults.getAlt,
        captureScreenshot:
          platform === 'twitter'
            ? typeof platformConfig.captureScreenshot === 'boolean'
              ? platformConfig.captureScreenshot
              : (fallbackDefaults.captureScreenshot ?? true)
            : undefined,
        providerId: platformConfig.providerId ?? null,
      };
    }
  } catch (e) {
    console.error('Failed to read platform config from storage, using defaults:', e);
  }
  return { ...fallbackDefaults };
}

export function createPlatformStore(options: PlatformStoreOptions) {
  const { id: platform, defaults: fallback, capabilities, extraItems = [] } = options;
  const platformState = reactive<PlatformState>({
    configBar: {
      visible: false,
      translate: fallback.translate,
      captureScreenshot: fallback.captureScreenshot ?? true,
      copyImages: fallback.copyImages,
      download: fallback.download,
      getAlt: fallback.getAlt ?? false,
      selectedProviderId: fallback.providerId ?? null,
    },
  });

  async function loadPlatformConfig() {
    const settings = await getPlatformSettingsFromStorage(platform);
    platformState.configBar.translate = settings.translate;
    platformState.configBar.copyImages = settings.copyImages;
    platformState.configBar.download = settings.download;
    platformState.configBar.getAlt = settings.getAlt ?? false;
    if (!platformState.configBar.copyImages) {
      platformState.configBar.download = false;
      platformState.configBar.getAlt = false;
    }
    if (capabilities.screenshot && settings.captureScreenshot !== undefined) {
      platformState.configBar.captureScreenshot = settings.captureScreenshot;
    }

    // 优先使用该平台独立指定的翻译服务，若无则回退到全局 defaultProviderId 或第一个可用服务
    const providerId = settings.providerId || appState.defaultProviderId;
    const matchedProvider =
      appState.providers.find((p) => p.id === providerId) || appState.providers[0];

    if (matchedProvider) {
      platformState.configBar.selectedProviderId = matchedProvider.id;
      applyProvider(matchedProvider);
    } else {
      platformState.configBar.selectedProviderId = null;
    }
  }

  const configItems = computed<ConfigItem[]>(() => [
    {
      key: 'translate',
      label: '是否翻译',
      type: 'toggle',
      value: platformState.configBar.translate,
    },
    {
      key: 'selectedProviderId',
      label: '翻译服务',
      type: 'select',
      value: platformState.configBar.selectedProviderId || '',
      dependsOn: 'translate',
      options: appState.providers.map((p) => ({
        label: p.name,
        value: p.id,
      })),
    },
    ...(capabilities.screenshot
      ? [
          {
            key: 'captureScreenshot',
            label: '是否截图',
            type: 'toggle' as const,
            value: platformState.configBar.captureScreenshot,
          },
        ]
      : []),
    {
      key: 'copyImages',
      label: '复制图片',
      type: 'toggle',
      value: platformState.configBar.copyImages,
    },
    ...(capabilities.imageAlt
      ? [
          {
            key: 'getAlt',
            label: '获取ALT',
            type: 'toggle' as const,
            value: platformState.configBar.getAlt,
            dependsOn: 'copyImages',
          },
        ]
      : []),
    {
      key: 'download',
      label: '图片下载到本地',
      type: 'toggle',
      value: platformState.configBar.download,
      dependsOn: 'copyImages',
    },
    ...extraItems,
  ]);

  function updateConfig(key: string, value: boolean | string) {
    const configBar = platformState.configBar;
    switch (key) {
      case 'visible':
        configBar.visible = value as boolean;
        break;
      case 'translate':
        configBar.translate = value as boolean;
        break;
      case 'captureScreenshot':
        configBar.captureScreenshot = value as boolean;
        break;
      case 'copyImages':
        configBar.copyImages = value as boolean;
        if (!value) {
          configBar.download = false;
          configBar.getAlt = false;
        }
        break;
      case 'download':
        configBar.download = value as boolean;
        break;
      case 'getAlt':
        configBar.getAlt = value as boolean;
        break;
      case 'selectedProviderId':
        configBar.selectedProviderId = value as string;
        if (value) {
          const provider = appState.providers.find((p) => p.id === value);
          if (provider) {
            applyProvider(provider);
          }
        }
        break;
    }
  }

  return { platformState, configItems, updateConfig, loadPlatformConfig };
}
