import { createPlatformStore } from "../../shared/composables/createPlatformStore";
import { createArticleSelectorObserver } from "../../shared/composables/createArticleSelectorObserver";

export const { platformState, configItems, updateConfig } =
  createPlatformStore();

export const observer = createArticleSelectorObserver({
  prefix: "instagram-copy",
  articleIdPrefix: "instagram-article",
  articleSelector: () => {
    if (document.querySelector('article[role="presentation"]')) {
      return 'article[role="presentation"]';
    }
    return "article";
  },
  singleSelect: true,
  getObserverTarget: () =>
    document.querySelector("article")?.parentElement ?? null,
  getAnchor: (article) => {
    if (article.getAttribute("role") !== "presentation") {
      return article.querySelector('div[aria-hidden="true"]');
    } else {
      // 太傻逼了，怎么要这样选择啊
      const ulType = article.querySelector(
        'div[role="presentation"]:has(img[srcset])',
      );
      const imgType = article.querySelector("img[srcset]");
      const videoType = article.querySelector("video");
      return (ulType || imgType || videoType || article) as HTMLElement | null;
    }
  },
});
