import { createPlatformStore } from "../../shared/composables/createPlatformStore";
import { createArticleSelectorObserver } from "../../shared/composables/createArticleSelectorObserver";

export const { platformState, configItems, updateConfig } = createPlatformStore();

const detailArticleIds: Set<string> = new Set();

export const observer = createArticleSelectorObserver({
    prefix: "instagram-copy",
    articleIdPrefix: "instagram-article",
    singleSelect: true,
    getObserverTarget: () => document.querySelector("article")?.parentElement ?? null,
    shouldSkipArticle: (article) => {
        const isDetailView = article.getAttribute("role") === "presentation";
        if (isDetailView) {
            const id = article.dataset.selectorId;
            if (id) detailArticleIds.add(id);
            return true;
        }
        return false;
    },
});
