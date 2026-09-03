import { appState } from '../../shared/store';
import { DEFAULT_PLATFORM_CONFIGS } from '../../options/types';
import { createPlatform } from '../../shared/platform/createPlatform';
import type { PlatformModule } from '../../shared/platform/types';
import type { PlatformState } from '../../shared/composables/createPlatformStore';
import { twitterAdapter } from './adapter';
import { collectArticleData } from './collectors/articleCollector';
import { collectTwitterVideos } from './collectors/videoCollector';

const observerConfig = {
  articleSelector: 'article',
  getObserverTarget: () => {
    let currElement: HTMLElement | null = document.querySelector('article');
    while (currElement) {
      if (currElement.dataset.testid === 'cellInnerDiv') return currElement.parentElement;
      currElement = currElement.parentElement;
    }
    return null;
  },
};

const getOptions = (state: PlatformState) => ({
  translate: state.configBar.translate,
  captureScreenshot: state.configBar.captureScreenshot,
  copyImages: state.configBar.copyImages,
  getAlt: state.configBar.getAlt,
  download: state.configBar.download,
  suffix: appState.options.suffix,
});

const twitterModule: PlatformModule = {
  id: 'twitter',
  defaults: DEFAULT_PLATFORM_CONFIGS.twitter,
  capabilities: {
    copy: true,
    videoDownload: true,
    screenshot: true,
    imageAlt: true,
    developerTools: true,
  },
  observer: observerConfig,
  copy: { adapter: twitterAdapter, getOptions },
  video: {
    canDownload: (articles) => articles.length === 1 && articles[0].querySelector('video') !== null,
    collectVideos: (articles) => collectTwitterVideos(articles[0]),
  },
  developerTools: {
    collectArticleData: (article) =>
      collectArticleData(article, { copyImages: true, getAlt: true }),
  },
  ui: { floatingButtonLabel: '复制', submitLabel: '复制', selectedCountLabel: '已选中推文' },
};

export const twitterPlatform = createPlatform(twitterModule);
