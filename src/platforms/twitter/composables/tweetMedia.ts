import { appState } from "../../../shared/store";
import { platformState } from "../platform";
import { toPng } from "html-to-image";
import { processImage, formatImageHtml, sleep } from "../../../shared/utils";
import { getTweetName } from "../utils";

const ORIG_IMAGE_PARAM = "orig";

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function captureScreenshots(articleList: HTMLElement[], tweetName: string): Promise<string> {
  appState.loading.text = "正在获取截图";

  const screenshots: string[] = [];
  for (const article of articleList) {
    const dataUrl = await toPng(article, { backgroundColor: "white" });
    screenshots.push(dataUrl);
  }

  const imageElements = await Promise.all(screenshots.map(loadImage));
  const totalHeight = imageElements.reduce((sum, img) => sum + img.naturalHeight, 0);
  const maxWidth = Math.max(...imageElements.map((img) => img.naturalWidth));

  const canvas = document.createElement("canvas");
  canvas.width = maxWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let yOffset = 0;
  for (const img of imageElements) {
    const x = (maxWidth - img.naturalWidth) / 2;
    ctx.drawImage(img, x, yOffset);
    yOffset += img.naturalHeight;
  }

  const mergedBase64 = canvas.toDataURL("image/png");
  const result = await processImage({ name: `${tweetName}.jpg`, url: mergedBase64 }, platformState.configBar.download);
  return formatImageHtml(result);
}

function getImgElementList(article: HTMLElement): HTMLImageElement[] {
  const ariaLabelledbyDiv = article.querySelector<HTMLElement>("div[aria-labelledby]");
  const extraElement = ariaLabelledbyDiv?.children[0] as HTMLElement | undefined;

  if (!ariaLabelledbyDiv || !extraElement) return [];

  // 防止将引用块当成图片块
  const time = extraElement?.querySelector("time");
  if (time) return [];

  // 有视频的部分会把视频的预览图也获取到，先这样处理看看
  const presentationList = Array.from(extraElement.querySelectorAll('div[role="presentation"]'));
  if (presentationList.length > 0) {
    const imagePresentationList = presentationList.filter((item) => !item.querySelector("video"));
    return imagePresentationList.map((item) => item.querySelector("img")).filter((item) => !!item);
  }

  return Array.from(extraElement.querySelectorAll("img"));
}

async function extractTweetImages(article: HTMLElement, tweetName: string, startIndex: number, totalCount: number): Promise<string[]> {
  const imgElementList = getImgElementList(article);
  const images: string[] = [];
  let index = startIndex;

  for (const imgElement of imgElementList) {
    appState.loading.text = `正在获取图片（${index++}/${totalCount}）`;
    const [baseUrl, search] = imgElement.src.split("?");
    const searchParam = new URLSearchParams(search);
    searchParam.set("name", ORIG_IMAGE_PARAM);
    const imgUrl = baseUrl + "?" + searchParam.toString();

    const result = await processImage({ name: `${tweetName}_${baseUrl.split("/").pop()}.jpg`, url: imgUrl }, platformState.configBar.download);
    images.push(formatImageHtml(result));
  }

  return images;
}

async function extractAllTweetImages(articleList: HTMLElement[]): Promise<string[]> {
  const allImages: string[] = [];
  let globalIndex = 1;
  let totalCount = 0;

  for (const article of articleList) {
    totalCount += getImgElementList(article).length;
  }

  for (const article of articleList) {
    article.scrollIntoView({ behavior: "instant", block: "center" });
    await sleep(200);
    const tweetName = getTweetName(article);
    const images = await extractTweetImages(article, tweetName, globalIndex, totalCount);
    globalIndex += images.length;
    allImages.push(...images);
  }

  return allImages;
}

export { captureScreenshots, extractAllTweetImages };
