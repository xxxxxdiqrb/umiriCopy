import { createApp, type Component } from 'vue';
import { appState, applyProvider } from '../store';
import { createElement } from '../utils';
import { normalizeProviderConfig, type ProviderConfig } from '../../options/types';
import type { PlatformInstance } from './types';

export async function bootstrapPlatform(
  app: Component,
  definition: PlatformInstance,
  mountId: string,
): Promise<void> {
  const stored = (await chrome.storage.local.get('options')).options;
  const rawProviders = stored?.providers;
  if (rawProviders) {
    const providers: ProviderConfig[] = Array.isArray(rawProviders)
      ? rawProviders.map((provider: Partial<ProviderConfig>) => normalizeProviderConfig(provider))
      : Object.values(rawProviders).map((provider) =>
          normalizeProviderConfig(provider as Partial<ProviderConfig>),
        );
    if (providers.length) {
      appState.providers = providers;
      appState.defaultProviderId = stored.defaultProviderId;
      definition.state.configBar.selectedProviderId = stored.defaultProviderId;
      const provider =
        providers.find((item) => item.id === stored.defaultProviderId) || providers[0];
      if (provider) applyProvider(provider);
    }
  }
  const host = createElement(
    `<div id="${mountId}" style="z-index:20000;position:fixed;top:0;left:0;width:0;height:0"></div>`,
  );
  document.body.appendChild(host);
  createApp(app).mount(host);
}
