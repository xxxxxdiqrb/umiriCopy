import { appState } from "../../shared/store";
import { createPlatformStore } from "../../shared/composables/createPlatformStore";
import { createArticleSelectorObserver } from "../../shared/composables/createArticleSelectorObserver";

export const { platformState, configItems, updateConfig } = createPlatformStore();

export const observer = createArticleSelectorObserver({
    prefix: "tweet-copy",
    articleIdPrefix: "article",
    getObserverTarget: () => {
        let currElement: HTMLElement | null = document.querySelector("article");
        while (currElement) {
            if (currElement.dataset.testid === "cellInnerDiv") {
                return currElement.parentElement;
            }
            currElement = currElement.parentElement;
        }
        return null;
    },
    onObserverChange: () => {
        const currentArticleIds = new Set<string>();
        const articleList = Array.from(document.querySelectorAll("article"));
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
