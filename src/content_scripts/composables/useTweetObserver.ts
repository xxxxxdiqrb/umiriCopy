import { h, render, type VNode } from "vue";
import { createElement } from "../../utils";
import ArticleSelector from "../components/ArticleSelector.vue";

const mountedSelectors: Map<string, { host: HTMLElement; vnode: VNode; article: HTMLElement }> = new Map();
const borderElements: Map<string, HTMLElement> = new Map();
const activeObservers: MutationObserver[] = [];
let articleIdCounter = 0;
let overlayElement: HTMLElement | null = null;
let overlayHost: HTMLElement | null = null;
let resizeHandler: (() => void) | null = null;

const BORDER_RADIUS = 12;

function getArticleId(article: HTMLElement): string {
    if (!article.dataset.selectorId) {
        article.dataset.selectorId = `article-${++articleIdCounter}`;
    }
    return article.dataset.selectorId;
}

function addObserver(): void {
    const observer = new MutationObserver(handleMainChildListChange);

    let currElemnt: HTMLElement | null = document.querySelector("article");
    while (currElemnt) {
        if (currElemnt.dataset.testid === "cellInnerDiv") {
            currElemnt = currElemnt.parentElement;
            break;
        }
        currElemnt = currElemnt.parentElement;
    }
    if (!currElemnt) {
        console.log("找不到listNode");
        return;
    }

    // 监听列表元素
    observer.observe(currElemnt, { childList: true });
    activeObservers.push(observer);
}

function createOverlay() {
    if (overlayHost) return;
    overlayHost = createElement<HTMLDivElement>(`<div style="position: relative; width: 0; height: 0;"></div>`);
    overlayElement = createElement<HTMLDivElement>(
        `<div id="tweet-copy-overlay" style="position: absolute; top: 0; left: 0; width: ${document.documentElement.scrollWidth}px; height: ${document.documentElement.scrollHeight}px; background-color: rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); z-index: 999; pointer-events: auto; opacity: 0; transition: opacity 0.3s ease;"></div>`,
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

function updateAllSelectorPositions() {
    updateOverlaySize();
    for (const [id, { host, article }] of mountedSelectors) {
        updateSelectorPosition(host, article);
        const border = borderElements.get(id);
        if (border) updateBorderPosition(border, article);
    }
    updateOverlayMask();
}

function updateOverlaySize() {
    if (!overlayElement) return;
    overlayElement.style.width = `${document.documentElement.scrollWidth}px`;
    overlayElement.style.height = `${document.documentElement.scrollHeight}px`;
}

function updateOverlayMask() {
    if (!overlayElement || mountedSelectors.size === 0) return;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollWidth = document.documentElement.scrollWidth;

    let svg = document.getElementById("tweet-copy-svg-mask") as unknown as SVGSVGElement;
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "tweet-copy-svg-mask";
        svg.setAttribute("width", "0");
        svg.setAttribute("height", "0");
        svg.style.position = "absolute";
        document.body.appendChild(svg);
    }

    const ns = "http://www.w3.org/2000/svg";
    const maskId = "tweet-copy-mask";

    let mask = svg.querySelector("mask") as SVGMaskElement;
    if (!mask) {
        mask = document.createElementNS(ns, "mask") as SVGMaskElement;
        mask.id = maskId;
        svg.appendChild(mask);
    }
    mask.innerHTML = "";

    const outerRect = document.createElementNS(ns, "rect");
    outerRect.setAttribute("x", "0");
    outerRect.setAttribute("y", "0");
    outerRect.setAttribute("width", String(scrollWidth));
    outerRect.setAttribute("height", String(scrollHeight));
    outerRect.setAttribute("fill", "white");
    mask.appendChild(outerRect);

    for (const [, { article }] of mountedSelectors) {
        const rect = article.getBoundingClientRect();
        const left = rect.left + scrollX;
        const top = rect.top + scrollY;
        const width = rect.width;
        const height = rect.height;

        const hole = document.createElementNS(ns, "rect");
        hole.setAttribute("x", String(left));
        hole.setAttribute("y", String(top));
        hole.setAttribute("width", String(width));
        hole.setAttribute("height", String(height));
        hole.setAttribute("rx", String(BORDER_RADIUS));
        hole.setAttribute("ry", String(BORDER_RADIUS));
        hole.setAttribute("fill", "black");
        mask.appendChild(hole);
    }

    overlayElement.style.maskImage = `url(#${maskId})`;
    overlayElement.style.webkitMaskImage = `url(#${maskId})`;
}

function createBorderElement(article: HTMLElement, articleId: string): HTMLElement {
    const border = document.createElement("div");
    border.className = "tweet-copy-border";
    border.style.cssText = `position: absolute; border-radius: ${BORDER_RADIUS}px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 0 12px rgba(0,0,0,0.25); pointer-events: none; z-index: 1001;`;
    updateBorderPosition(border, article);
    overlayHost!.appendChild(border);
    borderElements.set(articleId, border);
    return border;
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

function mountSelectorToArticle(article: HTMLElement, articleId: string) {
    if (!overlayHost) return;
    const host = createElement<HTMLDivElement>(`<div class="selector-host" style="position: absolute; z-index: 1002; pointer-events: auto;"></div>`);

    updateSelectorPosition(host, article);
    overlayHost.appendChild(host);

    const vnode = h(ArticleSelector, { article, articleId });
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
        if (!mountedSelectors.has(id)) {
            mountSelectorToArticle(articleEl, id);
        }
    }
    updateOverlayMask();
}

function handleMainChildListChange() {
    console.log("change");
    mountNewArticles();
    updateAllSelectorPositions();
}

export function mountSelectorsToAllArticles() {
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

export async function unmountAllSelectors() {
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

    const svgMask = document.getElementById("tweet-copy-svg-mask");
    if (svgMask) svgMask.remove();
}
