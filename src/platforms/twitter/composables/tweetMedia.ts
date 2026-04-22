import { appState } from "../../../shared/store";
import { platformState } from "../platform";
import { toPng } from "html-to-image";
import { processImage, formatImageHtml } from "../../../shared/utils";

const ORIG_IMAGE_PARAM = "orig";

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function captureScreenshots(
  articleList: HTMLElement[],
  tweetName: string,
): Promise<string> {
  appState.loading.text = "正在获取截图";

  const screenshots: string[] = [];
  for (const article of articleList) {
    const dataUrl = await toPng(article, { backgroundColor: "white" });
    screenshots.push(dataUrl);
  }

  const imageElements = await Promise.all(screenshots.map(loadImage));
  const totalHeight = imageElements.reduce(
    (sum, img) => sum + img.naturalHeight,
    0,
  );
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
  const result = await processImage(
    { name: `${tweetName}.jpg`, url: mergedBase64 },
    platformState.configBar.download,
  );
  return formatImageHtml(result);
}

function getImgElementList(divList: HTMLElement[]): HTMLImageElement[] {
  const ariaLabelledbyDiv = divList.find((item) =>
    item.getAttribute("aria-labelledby"),
  );
  const extraElement = ariaLabelledbyDiv?.children[0] as
    | HTMLElement
    | undefined;
  const span = extraElement?.querySelector("span");

  if (!ariaLabelledbyDiv || !extraElement) return [];
  if (
    span &&
    span.textContent !== "ALT" &&
    span.parentElement?.nodeName !== "A"
  )
    return [];

  return Array.from(extraElement.querySelectorAll("img"));
}

async function extractTweetImages(
  divList: HTMLElement[],
  tweetName: string,
  startIndex: number,
  totalCount: number,
): Promise<string[]> {
  const imgElementList = getImgElementList(divList);
  const images: string[] = [];
  let index = startIndex;

  for (const imgElement of imgElementList) {
    appState.loading.text = `正在获取图片（${index++}/${totalCount}）`;
    const [baseUrl, search] = imgElement.src.split("?");
    const searchParam = new URLSearchParams(search);
    searchParam.set("name", ORIG_IMAGE_PARAM);
    const imgUrl = baseUrl + "?" + searchParam.toString();

    const result = await processImage(
      { name: `${tweetName}_${baseUrl.split("/").pop()}.jpg`, url: imgUrl },
    platformState.configBar.download,
    );
    images.push(formatImageHtml(result));
  }

  return images;
}

async function extractAllTweetImages(
  articleList: HTMLElement[],
  tweetName: string,
): Promise<string[]> {
  const allImages: string[] = [];
  let globalIndex = 1;
  let totalCount = 0;

  for (const article of articleList) {
    const divList = Array.from(
      article.querySelectorAll("div"),
    ) as HTMLElement[];
    totalCount += getImgElementList(divList).length;
  }

  for (const article of articleList) {
    const divList = Array.from(
      article.querySelectorAll("div"),
    ) as HTMLElement[];
    const images = await extractTweetImages(
      divList,
      tweetName,
      globalIndex,
      totalCount,
    );
    globalIndex += images.length;
    allImages.push(...images);
  }

  return allImages;
}

export { captureScreenshots, extractAllTweetImages };
