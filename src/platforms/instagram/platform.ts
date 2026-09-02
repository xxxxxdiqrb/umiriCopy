import { createPlatformStore } from '../../shared/composables/createPlatformStore';
import { createArticleSelectorObserver } from '../../shared/composables/createArticleSelectorObserver';
import { DEFAULT_PLATFORM_CONFIGS } from '../../options/types';

export const { platformState, configItems, updateConfig, loadPlatformConfig } = createPlatformStore(
  {
    id: 'instagram',
    defaults: DEFAULT_PLATFORM_CONFIGS.instagram,
    capabilities: {
      copy: true,
      videoDownload: true,
      screenshot: false,
      imageAlt: false,
      developerTools: false,
    },
  },
);

export const observer = createArticleSelectorObserver({
  prefix: 'instagram-copy',
  articleIdPrefix: 'instagram-article',
  articleSelector: () => {
    if (document.querySelector('article[role="presentation"]')) {
      return 'article[role="presentation"]';
    }
    return 'article';
  },
  singleSelect: true,
  getObserverTarget: () => document.querySelector('article')?.parentElement ?? null,
  getAnchor: (article) => {
    if (article.getAttribute('role') !== 'presentation') {
      return (
        article.querySelector('div[role="presentation"]') || article.querySelector('div._aagu')
      );
    } else {
      const ulType = article.querySelector('div[role="presentation"]:has(img[srcset])');
      const imgType = article.querySelector('img[srcset]');
      const videoType = article.querySelector('video');
      return (ulType || imgType || videoType || article) as HTMLElement | null;
    }
  },
});
