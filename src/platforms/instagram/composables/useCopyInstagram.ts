import { appState } from "../../../shared/store";
import { platformState } from "../platform";
import { waitATick, formatDateForFilename, processImage, formatImageHtml, getOpenAITranslation } from "../../../shared/utils";

function isScrollable(element: HTMLElement): boolean {
  const overflowX = getComputedStyle(element).overflowX;

  const hasHorizontalOverflow = element.scrollWidth > element.clientWidth;

  const canScrollHorizontally = hasHorizontalOverflow && (overflowX === "auto" || overflowX === "scroll" || overflowX === "overlay");

  return canScrollHorizontally;
}

function findScrollElement(element: HTMLElement | null): HTMLElement | null {
  let curr: HTMLElement | null = element;
  while (curr && !isScrollable(curr)) {
    curr = curr.parentElement;
  }
  return curr;
}

async function getInstagramImageUrlList(article: HTMLElement, isDetail: boolean): Promise<string[]> {
  let ul: HTMLElement | null = null,
    scrollElement: HTMLElement | null = null;
  if (!isDetail) {
    const carouselContainer = article.querySelector('div[aria-hidden="true"]') as HTMLElement;

    ul = carouselContainer.querySelector("ul") as HTMLElement;
    scrollElement = findScrollElement(ul);

    if (!ul || !scrollElement) {
      return Array.from(carouselContainer.querySelectorAll("img")).map((item) => item.src);
    }
  } else {
    const carouselButton = article.querySelector("div + button[aria-label]");
    if (carouselButton) {
      scrollElement = carouselButton.previousElementSibling as HTMLElement | null;
      ul = scrollElement?.querySelector("ul") as HTMLElement | null;
    }

    if (!ul || !scrollElement) {
      return Array.from(article.querySelectorAll("img[srcset]")).map((item) => (item as HTMLImageElement).src);
    }
  }

  return getUlImageList(scrollElement, ul);
}

async function getUlImageList(scrollElement: HTMLElement, container: HTMLElement): Promise<string[]> {
  const imageUrlSet = new Set<string>();

  scrollElement.scrollLeft = 0;
  await waitATick();

  const endLeft = scrollElement.scrollWidth - scrollElement.clientWidth;
  while (scrollElement.scrollLeft < endLeft) {
    scrollElement.scrollLeft += scrollElement.clientWidth;
    await waitATick();

    const imgList = container.querySelectorAll("img");
    for (const img of imgList) {
      imageUrlSet.add(img.src);
    }
  }

  return Array.from(imageUrlSet);
}

async function getInstagramCaption(article: HTMLElement, isDetail: boolean): Promise<string> {
  if (isDetail) {
    const name = article.querySelector("h2")?.innerText;
    if (!name) {
      return "";
    }
    const time = article.querySelector("time") as HTMLTimeElement;
    const timeString = new Date(time.dateTime).toLocaleString();
    const caption = article.querySelector("h1")?.innerText;
    return `@${name} · ${timeString}\n${caption}`;
  } else {
    const moreTextButton = article.querySelector('span > div[aria-disabled="false"]') as HTMLElement | null;
    if (moreTextButton) {
      moreTextButton.click();
      await waitATick();
    }

    const captionElement = article.querySelector("section + div") as HTMLElement | null;
    if (!captionElement) {
      return "";
    }

    const textSplit = captionElement.innerText.split("\n");
    const name = textSplit.shift();
    const caption = textSplit.join("\n");
    const time = article.querySelector("time") as HTMLTimeElement;
    const timeString = new Date(time.dateTime).toLocaleString();
    return `@${name} · ${timeString}\n${caption}`;
  }
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

  const isDetail = firstArticle.getAttribute("role") === "presentation";

  let text = await getInstagramCaption(firstArticle, isDetail);
  if (text) {
    if (platformState.configBar.translate) {
      appState.loading.text = "正在翻译文本";
      text = await getOpenAITranslation(text);
    }
    copyContentList.push(text);
  }

  if (platformState.configBar.copyImages) {
    const imageUrlList = await getInstagramImageUrlList(firstArticle, isDetail);
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
