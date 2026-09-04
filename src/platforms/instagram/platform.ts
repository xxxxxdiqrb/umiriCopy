import { DEFAULT_PLATFORM_CONFIGS } from '../../options/types';
import type { PlatformState } from '../../shared/composables/createPlatformStore';
import { createPlatform } from '../../shared/platform/createPlatform';
import type { PlatformModule } from '../../shared/platform/types';
import { appState } from '../../shared/store';
import { instagramAdapter } from './adapter';
import { collectArticleData } from './collectors/articleCollector';
import { collectInstagramVideos } from './collectors/videoCollector';

const observerConfig = {
  articleSelector: () =>
    document.querySelector('article[role="presentation"]')
      ? 'article[role="presentation"]'
      : 'article',
  singleSelect: true,
  getObserverTarget: () => document.querySelector('article')?.parentElement ?? null,
  getAnchor: (article: HTMLElement) =>
    article.getAttribute('role') !== 'presentation'
      ? article.querySelector<HTMLElement>('div[role="presentation"], div._aagu')
      : article.querySelector<HTMLElement>('div[role="presentation"]:has(img[srcset])') ||
        article.querySelector<HTMLElement>('img[srcset]') ||
        article.querySelector<HTMLElement>('video') ||
        article,
};

const getOptions = (state: PlatformState) => ({
  translate: state.configBar.translate,
  captureScreenshot: false,
  copyImages: state.configBar.copyImages,
  getAlt: false,
  download: state.configBar.download,
  suffix: appState.options.suffix,
});

const instagramModule: PlatformModule = {
  id: 'instagram',
  defaults: DEFAULT_PLATFORM_CONFIGS.instagram,
  capabilities: {
    copy: true,
    videoDownload: true,
    screenshot: false,
    imageAlt: false,
    developerTools: true,
  },
  observer: observerConfig,
  copy: { adapter: instagramAdapter, getOptions },
  video: {
    canDownload: (articles) => articles.length === 1 && articles[0].querySelector('video') !== null,
    collectVideos: (articles) => collectInstagramVideos(articles[0]),
  },
  developerTools: {
    collectArticleData: (article) => collectArticleData(article, { copyImages: true }),
  },
  ui: { floatingButtonLabel: '复制', submitLabel: '复制', selectedCountLabel: '已选中帖子' },
};
export const instagramPlatform = createPlatform(instagramModule);
