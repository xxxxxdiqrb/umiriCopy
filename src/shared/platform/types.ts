import type { ComputedRef } from 'vue';
import type { ConfigItem } from '../types';
import type { PlatformState } from '../composables/createPlatformStore';
import type { PlatformAdapter, CopyPipelineOptions } from '../copy/types';
import type { PlatformSettings } from '../../options/types';
import type { VideoDownloadResource } from '../composables/useVideoDownload';

export type PlatformObserver = ReturnType<
  typeof import('../composables/createArticleSelectorObserver').createArticleSelectorObserver
>;

export interface PlatformCapabilities {
  copy: boolean;
  videoDownload: boolean;
  screenshot: boolean;
  imageAlt: boolean;
  developerTools: boolean;
}

export interface PlatformDefinition {
  id: string;
  state: PlatformState;
  updateConfig: (key: string, value: boolean | string) => void;
  configItems: ComputedRef<ConfigItem[]>;
  observer: PlatformObserver;
  capabilities: PlatformCapabilities;
  copy?: {
    adapter: PlatformAdapter;
    getOptions: () => CopyPipelineOptions;
    validate?: () => string | null;
  };
  video?: { canDownload: (articles: HTMLElement[]) => boolean; collectVideos: (articles: HTMLElement[]) => Promise<VideoDownloadResource[]> };
  developerTools?: { collectArticleData: (article: HTMLElement) => Promise<unknown> };
  ui: { floatingButtonLabel: string; submitLabel: string; selectedCountLabel: string };
}

export interface PlatformStoreOptions {
  id: string;
  defaults: PlatformSettings;
  capabilities: Partial<PlatformCapabilities>;
  extraItems?: ConfigItem[];
}
