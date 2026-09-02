import type { PlatformAdapter } from '../../shared/copy/types';
import { collectArticlesData } from './collectors/articleCollector';
import { captureTwitterScreenshots } from './screenshot/screenshotAdapter';

export const twitterAdapter: PlatformAdapter = {
  platform: 'twitter',
  capabilities: { screenshot: true, imageAlt: true, video: true },
  collectArticlesData,
  captureScreenshot: captureTwitterScreenshots,
};
