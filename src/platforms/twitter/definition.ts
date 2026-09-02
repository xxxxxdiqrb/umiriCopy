import { appState } from '../../shared/store';
import type { CopyPipelineOptions } from '../../shared/copy/types';
import type { PlatformDefinition } from '../../shared/platform/types';
import { platformState, configItems, observer, updateConfig } from './platform';
import { twitterAdapter } from './adapter';
import { collectTwitterVideos } from './collectors/videoCollector';
import { collectArticleData } from './collectors/articleCollector';

const getOptions = (): CopyPipelineOptions => ({
  translate: platformState.configBar.translate,
  captureScreenshot: platformState.configBar.captureScreenshot,
  copyImages: platformState.configBar.copyImages,
  getAlt: platformState.configBar.getAlt,
  download: platformState.configBar.download,
  suffix: appState.options.suffix,
});

export const twitterDefinition: PlatformDefinition = {
  id: 'twitter',
  state: platformState,
  updateConfig,
  configItems,
  observer,
  capabilities: {
    copy: true,
    videoDownload: true,
    screenshot: true,
    imageAlt: true,
    developerTools: true,
  },
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
