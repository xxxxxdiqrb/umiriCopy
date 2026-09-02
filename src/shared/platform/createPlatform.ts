import { createArticleSelectorObserver } from '../composables/createArticleSelectorObserver';
import { createPlatformStore } from '../composables/createPlatformStore';
import { appState } from '../store';
import { executeCopyPipeline } from '../copy/pipeline';
import type { PlatformInstance, PlatformModule } from './types';

export function createPlatform(module: PlatformModule): PlatformInstance {
  const store = createPlatformStore({
    id: module.id,
    defaults: module.defaults,
    capabilities: module.capabilities,
    extraItems: module.config?.extraItems,
  });
  const observer = createArticleSelectorObserver(module.observer);
  const instance = {
    id: module.id,
    state: store.platformState,
    updateConfig: store.updateConfig,
    configItems: store.configItems,
    observer,
    capabilities: module.capabilities,
    video: module.video,
    developerTools: module.developerTools,
    ui: module.ui,
    config: {
      items: store.configItems,
      update: store.updateConfig,
      load: store.loadPlatformConfig,
    },
    copy: module.copy
      ? {
          execute: (articles: HTMLElement[], reporter: (text: string) => void) =>
            executeCopyPipeline(
              articles,
              module.copy!.adapter,
              module.copy!.getOptions(store.platformState),
              {
                ...appState.options,
                customVariables: Object.entries(appState.options.otherParam).map(
                  ([name, value]) => ({ name, value: String(value) }),
                ),
              },
              reporter,
            ),
          validate: module.copy.validate
            ? () => module.copy!.validate!(store.platformState)
            : undefined,
        }
      : undefined,
  };
  return instance;
}
