import { appState } from "../../../shared/store";
import { platformState } from "../platform";
import { waitATick, formatDateForFilename, processImage, formatImageHtml } from "../../../shared/utils";

function getElementPosition(element: HTMLElement): number {
    return element.clientWidth / 2 + element.getBoundingClientRect().left;
}

async function resetImageList(article: HTMLElement, ul: HTMLElement) {
    const carouselButton = article.querySelector("button[aria-label]") as HTMLElement;
    if (!carouselButton || getElementPosition(carouselButton) > getElementPosition(article)) {
        return;
    }
    while (article.contains(carouselButton)) {
        carouselButton.click();
        await awaitElementChange(ul);
    }
    return;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function awaitElementChange(element: HTMLElement): Promise<void> {
    // 暂时没想到怎么处理这个，先顶着用吧
    return sleep(200);
    return new Promise((resolve) => {
        if (!element) {
            resolve();
        }
        const observer = new MutationObserver(() => {
            observer.disconnect();
            resolve();
        });
        observer.observe(element, { childList: true });

        console.log(observer, element);
    });
}

async function getInstagramImageUrlList(article: HTMLElement): Promise<string[]> {
    const carouselContainer = article.querySelector('div[aria-hidden="true"]') as HTMLElement;
    const imageUrlSet = new Set<string>(Array.from(carouselContainer.querySelectorAll("img")).map((item) => item.src));

    const ul = carouselContainer.querySelector("ul") as HTMLElement;

    await resetImageList(article, ul);

    const carouselNextButton = article.querySelector("button[aria-label]") as HTMLElement | null;
    if (!carouselNextButton) {
        return Array.from(imageUrlSet);
    }

    while (article.contains(carouselNextButton)) {
        carouselNextButton.click();
        await awaitElementChange(ul);

        const imgList = carouselContainer.querySelectorAll("img");
        for (const img of imgList) {
            imageUrlSet.add(img.src);
        }
    }

    return Array.from(imageUrlSet);
}

async function getInstagramCaption(article: HTMLElement): Promise<string> {
    const moreTextButton = article.querySelector('span > div[aria-disabled="false"]') as HTMLElement | null;
    if (moreTextButton) {
        moreTextButton.click();
        await waitATick();
    }

    const captionElement = article.querySelector("section + div") as HTMLElement | null;
    if (!captionElement) {
        return "";
    }

    const caption = captionElement.innerText.split("\n").slice(1).join("\n");
    return caption;
}

function getInstagramName(article: HTMLElement): string {
    const timeElement = article.querySelector("time");
    const date = timeElement ? new Date(timeElement.getAttribute("datetime")!) : new Date();
    const timeStr = formatDateForFilename(date);
    return `instagram_${timeStr}`;
}

export async function copyInstagram(articleList: HTMLElement[]): Promise<string> {
    appState.loading.text = "正在复制 Instagram 内容";

    const firstArticle = articleList[0];
    const instagramName = getInstagramName(firstArticle);

    const copyContentList: string[] = [];

    const text = await getInstagramCaption(firstArticle);
    if (text) {
        copyContentList.push(text);
    }

    if (platformState.configBar.copyImages) {
        const imageUrlList = await getInstagramImageUrlList(firstArticle);
        const total = imageUrlList.length;
        const imageHtmlList: string[] = [];
        for (let i = 0; i < imageUrlList.length; i++) {
            appState.loading.text = `正在获取图片（${i + 1}/${total}）`;
            const result = await processImage({ name: `${instagramName}_${i}.jpg`, url: imageUrlList[i] }, platformState.configBar.download);
            imageHtmlList.push(formatImageHtml(result));
        }
        copyContentList.push(...imageHtmlList);
    }

    return copyContentList.join("\n");
}
