import type { PlatformAdapter } from '../../shared/copy/types';
import { collectArticlesData } from './collectors/tweetArticleCollector';
import { processArticleImages, processScreenshot } from './media/tweetImageProcessor';
import { captureTwitterScreenshots } from './screenshot/twitterScreenshot';

export const twitterAdapter: PlatformAdapter = {
  platform: 'twitter',
  capabilities: { screenshot: true, imageAlt: true, video: true },
  collectArticlesData: (articles, options) =>
    collectArticlesData(articles, options),
  processArticleImages,
  captureScreenshot: captureTwitterScreenshots,
  processScreenshot,
};
