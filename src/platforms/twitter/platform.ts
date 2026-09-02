import { appState } from '../../shared/store';
import { createPlatformStore } from '../../shared/composables/createPlatformStore';
import { createArticleSelectorObserver } from '../../shared/composables/createArticleSelectorObserver';
import { DEFAULT_PLATFORM_CONFIGS } from '../../options/types';

export const { platformState, configItems, updateConfig, loadPlatformConfig } = createPlatformStore(
  {
    id: 'twitter',
    defaults: DEFAULT_PLATFORM_CONFIGS.twitter,
    capabilities: {
      copy: true,
      videoDownload: true,
      screenshot: true,
      imageAlt: true,
      developerTools: true,
    },
  },
);

export const observer = createArticleSelectorObserver({
  prefix: 'tweet-copy',
  articleIdPrefix: 'article',
  articleSelector: 'article',
  getObserverTarget: () => {
    let currElement: HTMLElement | null = document.querySelector('article');
    while (currElement) {
      if (currElement.dataset.testid === 'cellInnerDiv') {
        return currElement.parentElement;
      }
      currElement = currElement.parentElement;
    }
    return null;
  },
  onObserverChange: () => {
    const currentArticleIds = new Set<string>();
    const articleList = Array.from(document.querySelectorAll('article'));
    for (const article of articleList) {
      const articleEl = article as HTMLElement;
      const id = articleEl.dataset.selectorId;
      if (id) currentArticleIds.add(id);
    }
    for (const selectedId of appState.selectedArticles) {
      if (!currentArticleIds.has(selectedId)) {
        appState.selectedArticles.delete(selectedId);
      }
    }
  },
});
