import type { PlatformAdapter } from '../../shared/copy/types';
import { collectArticlesData } from './collectors/articleCollector';

export const instagramAdapter: PlatformAdapter = {
  platform: 'instagram',
  capabilities: { screenshot: false, imageAlt: false, video: true },
  collectArticlesData,
};
