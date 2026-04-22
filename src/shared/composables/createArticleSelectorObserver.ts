import { h, render, type VNode } from "vue";
import { createElement } from "../utils";
import { updateOverlayMask, removeOverlayMask } from "../utils/overlayMask";
import ArticleSelector from "../components/ArticleSelector.vue";
import { appState } from "../store";

const BORDER_RADIUS = 12;

export interface ArticleObserverConfig {
    prefix: string;
    articleIdPrefix: string;
    getObserverTarget(): HTMLElement | null;
    shouldSkipArticle?(article: HTMLElement): boolean;
    onObserverChange?(): void;
    singleSelect?: boolean;
}

interface SelectorEntry {
    host: HTMLElement;
    vnode: VNode;
    article: HTMLElement;
}

export function createArticleSelectorObserver(config: ArticleObserverConfig) {
    const { prefix, articleIdPrefix, getObserverTarget, shouldSkipArticle, onObserverChange, singleSelect } = config;

    const mountedSelectors: Map<string, SelectorEntry> = new Map();
    const borderElements: Map<string, HTMLElement> = new Map();
    const activeObservers: MutationObserver[] = [];
    let articleIdCounter = 0;
    let overlayElement: HTMLElement | null = null;
    let overlayHost: HTMLElement | null = null;
    let resizeHandler: (() => void) | null = null;

    function getArticleId(article: HTMLElement): string {
        if (!article.dataset.selectorId) {
            article.dataset.selectorId = `${articleIdPrefix}-${++articleIdCounter}`;
        }
        return article.dataset.selectorId;
    }

    function createOverlay() {
        if (overlayHost) return;
        overlayHost = createElement<HTMLDivElement>(`<div style="position: relative; width: 0; height: 0;"></div>`);
        overlayElement = createElement<HTMLDivElement>(
            `<div id="${prefix}-overlay" style="position: absolute; top: 0; left: 0; width: ${document.documentElement.scrollWidth}px; height: ${document.documentElement.scrollHeight}px; background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); z-index: 999; pointer-events: auto; opacity: 0; transition: opacity 0.3s ease;"></div>`,
        );
        overlayHost.appendChild(overlayElement);
        document.body.insertBefore(overlayHost, document.body.firstChild);

        requestAnimationFrame(() => {
            if (overlayElement) overlayElement.style.opacity = "1";
        });
    }

    function removeOverlay(): Promise<void> {
        return new Promise((resolve) => {
            if (!overlayHost || !overlayElement) {
                resolve();
                return;
            }

            const el = overlayElement;
            el.style.opacity = "0";

            const cleanup = () => {
                el.removeEventListener("transitionend", cleanup);
                overlayHost?.remove();
                overlayHost = null;
                overlayElement = null;
                resolve();
            };

            el.addEventListener("transitionend", cleanup);
            setTimeout(cleanup, 350);
        });
    }

    function updateSelectorPosition(host: HTMLElement, article: HTMLElement) {
        const rect = article.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        host.style.top = `${rect.top + scrollY}px`;
        host.style.left = `${rect.left + scrollX}px`;
        host.style.width = `${rect.width}px`;
        host.style.height = `${rect.height}px`;
    }

    function updateBorderPosition(border: HTMLElement, article: HTMLElement) {
        const rect = article.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        border.style.top = `${rect.top + scrollY}px`;
        border.style.left = `${rect.left + scrollX}px`;
        border.style.width = `${rect.width}px`;
        border.style.height = `${rect.height}px`;
    }

    function updateAllSelectorPositions() {
        if (!overlayElement) return;
        overlayElement.style.width = `${document.documentElement.scrollWidth}px`;
        overlayElement.style.height = `${document.documentElement.scrollHeight}px`;

        for (const [id, { host, article }] of mountedSelectors) {
            updateSelectorPosition(host, article);
            const border = borderElements.get(id);
            if (border) updateBorderPosition(border, article);
        }
        const articles = Array.from(mountedSelectors.values()).map((s) => s.article);
        updateOverlayMask(prefix, overlayElement, articles, BORDER_RADIUS);
    }

    function createBorderElement(article: HTMLElement, articleId: string): HTMLElement {
        const border = document.createElement("div");
        border.className = `${prefix}-border`;
        border.style.cssText = `position: absolute; border-radius: ${BORDER_RADIUS}px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 0 12px rgba(0,0,0,0.25); pointer-events: none; z-index: 1001;`;
        updateBorderPosition(border, article);
        overlayHost!.appendChild(border);
        borderElements.set(articleId, border);
        return border;
    }

    function mountSelectorToArticle(article: HTMLElement, articleId: string) {
        if (!overlayHost) return;
        const host = createElement<HTMLDivElement>(`<div class="selector-host" style="position: absolute; z-index: 1002; pointer-events: auto;"></div>`);

        updateSelectorPosition(host, article);
        overlayHost.appendChild(host);

        const vnode = h(ArticleSelector, { article, articleId, singleSelect });
        render(vnode, host);

        createBorderElement(article, articleId);

        mountedSelectors.set(articleId, { host, vnode, article });
    }

    function setupPositionListeners() {
        resizeHandler = () => {
            requestAnimationFrame(updateAllSelectorPositions);
        };
        window.addEventListener("resize", resizeHandler);
    }

    function removePositionListeners() {
        if (resizeHandler) {
            window.removeEventListener("resize", resizeHandler);
            resizeHandler = null;
        }
    }

    function mountNewArticles() {
        const articleList = Array.from(document.querySelectorAll("article"));
        for (const article of articleList) {
            const articleEl = article as HTMLElement;
            const id = getArticleId(articleEl);
            if (mountedSelectors.has(id)) continue;

            if (shouldSkipArticle?.(articleEl)) continue;

            mountSelectorToArticle(articleEl, id);
        }
        if (overlayElement) {
            const articles = Array.from(mountedSelectors.values()).map((s) => s.article);
            updateOverlayMask(prefix, overlayElement, articles, BORDER_RADIUS);
        }
    }

    function addObserver() {
        const target = getObserverTarget();
        if (!target) return;

        const observer = new MutationObserver(() => {
            mountNewArticles();
            updateAllSelectorPositions();
            onObserverChange?.();
        });
        observer.observe(target, { childList: true });
        activeObservers.push(observer);
    }

    function mountSelectorsToAllArticles() {
        const main = document.querySelector("main");
        if (!main) {
            requestAnimationFrame(mountSelectorsToAllArticles);
            return;
        }

        createOverlay();
        setupPositionListeners();
        mountNewArticles();
        addObserver();
    }

    async function unmountAllSelectors() {
        for (const [, border] of borderElements) {
            border.remove();
        }
        borderElements.clear();

        for (const observer of activeObservers) {
            observer.disconnect();
        }
        activeObservers.length = 0;

        for (const [, { host }] of mountedSelectors) {
            render(null, host);
            host.remove();
        }
        mountedSelectors.clear();

        removePositionListeners();

        await removeOverlay();

        removeOverlayMask(prefix);
    }

    function getSelectedArticleElements(): HTMLElement[] {
        const articles: HTMLElement[] = [];
        for (const id of appState.selectedArticles) {
            const selector = mountedSelectors.get(id);
            if (selector) {
                articles.push(selector.article);
            }
        }
        return articles;
    }

    return {
        mountSelectorsToAllArticles,
        unmountAllSelectors,
        getSelectedArticleElements,
    };
}
