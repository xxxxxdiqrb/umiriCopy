import { toPng } from 'html-to-image';
import {
  CopyStageError,
  formatDateForFilename,
  formatImageHtml,
  processImage,
  toCopyStageError,
  translateTextContents,
} from '../../../shared/utils';
import { extractTweetTextContent } from '../utils';
import { setVideoSize } from './videoHandler';

const ORIG_IMAGE_PARAM = 'orig';

export interface TweetCopyOptions {
  translate: boolean;
  captureScreenshot: boolean;
  copyImages: boolean;
  getAlt: boolean;
  download: boolean;
  suffix: string;
}

export interface ArticleImageData {
  url: string;
  alt: string;
}

export interface ArticleData {
  userName: string;
  time: string;
  textContent: string;
  imageDataList: ArticleImageData[];
}

export type MediaProgressReporter = (text: string) => void;

async function getAltText(presentation: Element): Promise<string> {
  try {
    const altButton = Array.from(presentation.querySelectorAll('span')).find(
      (item) => item.textContent === 'ALT',
    );
    if (!altButton) return '';
    await displayDialog();
    altButton.click();
    await waitForDialog(true);
    const textElement = document.querySelector('div[role="dialog"]')?.children?.[1];
    if (!(textElement instanceof HTMLElement)) return '';
    return extractTweetTextContent(textElement);
  } catch (error) {
    if (error instanceof CopyStageError) throw error;
    throw toCopyStageError('alt', '获取图片 ALT 文本失败', error);
  } finally {
    if (document.querySelector('div[data-testid="hoverCardParent"]')) {
      try {
        await displayDialog();
      } catch (error) {
        console.warn('关闭 ALT 弹窗失败', error);
      }
    }
  }
}

async function displayDialog(): Promise<void> {
  const hoverCard = document.querySelector('div[data-testid="hoverCardParent"]');
  const parent = hoverCard?.parentElement;
  if (!parent) return;

  // Twitter closes the ALT dialog when clicking the hover-card sibling.
  const clickTarget = Array.from(parent.children).find(
    (item): item is HTMLElement => item !== hoverCard && item instanceof HTMLElement,
  );
  if (!clickTarget) return;
  clickTarget.click();
  await waitForDialog(false);
}

async function waitForDialog(showDialog: boolean): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const startTime = performance.now();
    judge();

    function judge() {
      const hasDialog = document.querySelector('div[data-testid="hoverCardParent"]') != null;
      if ((showDialog && hasDialog) || (!showDialog && !hasDialog)) {
        resolve();
      } else if (performance.now() - startTime >= 5000) {
        reject(new Error(`等待弹窗${showDialog ? '显示' : '关闭'}超时`));
      } else {
        requestAnimationFrame(judge);
      }
    }
  });
}

export async function collectArticleImageData(
  article: HTMLElement,
  includeAlt: boolean,
): Promise<ArticleImageData[]> {
  const ariaLabelledbyDiv = article.querySelector<HTMLElement>('div[aria-labelledby]');
  const mediaContainer = ariaLabelledbyDiv?.children[0] as HTMLElement | undefined;
  if (!ariaLabelledbyDiv || !mediaContainer) return [];

  // A quoted tweet also has aria-labelledby; its time element identifies it as non-media.
  if (mediaContainer.querySelector('time')) return [];

  const presentations = Array.from(
    mediaContainer.querySelectorAll('div[role="presentation"]'),
  ).filter((item) => !item.querySelector('video'));

  const imageDataList: ArticleImageData[] = [];
  for (const presentation of presentations) {
    const image = presentation.querySelector<HTMLImageElement>('img');
    if (image) {
      imageDataList.push({
        url: image.src,
        alt: includeAlt ? await getAltText(presentation) : '',
      });
    }
  }
  return imageDataList;
}

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] || character,
  );
}

function getOriginalImageUrl(url: string): string {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set('name', ORIG_IMAGE_PARAM);
  return parsedUrl.toString();
}

function getArticleName(articleData: ArticleData): string {
  return `${articleData.userName}_${formatDateForFilename(new Date(articleData.time))}`;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('截图数据读取失败'));
    reader.readAsDataURL(blob);
  });
}

async function mergeScreenshots(screenshots: string[]): Promise<string> {
  const imageBitmaps: ImageBitmap[] = [];

  try {
    for (const base64 of screenshots) {
      const response = await fetch(base64);
      imageBitmaps.push(await createImageBitmap(await response.blob()));
    }

    const width = Math.max(...imageBitmaps.map((image) => image.width));
    const height = imageBitmaps.reduce((total, image) => total + image.height, 0);
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法创建截图画布');

    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    let yOffset = 0;
    for (const image of imageBitmaps) {
      context.drawImage(image, (width - image.width) / 2, yOffset);
      yOffset += image.height;
    }

    return blobToDataUrl(await canvas.convertToBlob({ type: 'image/png' }));
  } finally {
    for (const image of imageBitmaps) image.close();
  }
}

export async function captureArticleScreenshot(articleList: HTMLElement[]): Promise<string> {
  if (articleList.length === 0) return '';

  const { removeOverlay } = await setVideoSize(articleList);
  try {
    const screenshots: string[] = [];
    for (const article of articleList) {
      screenshots.push(await toPng(article, { backgroundColor: 'white' }));
    }
    return mergeScreenshots(screenshots);
  } finally {
    await removeOverlay();
  }
}

export async function processArticleImages(
  articleDataList: ArticleData[],
  options: TweetCopyOptions,
  reportProgress: MediaProgressReporter,
): Promise<string[]> {
  const imageEntries = articleDataList.flatMap((articleData) =>
    articleData.imageDataList.map((imageData) => ({ articleData, imageData })),
  );
  let altTexts = imageEntries.map(({ imageData }) => imageData.alt);

  if (options.getAlt && options.translate && altTexts.some((text) => text.trim())) {
    reportProgress('正在翻译ALT');
    try {
      altTexts = await translateTextContents(altTexts, true);
    } catch (error) {
      throw toCopyStageError('alt', 'ALT 文本翻译失败', error);
    }
  }

  const images: string[] = [];
  for (let index = 0; index < imageEntries.length; index++) {
    const { articleData, imageData } = imageEntries[index];
    reportProgress(`正在获取图片（${index + 1}/${imageEntries.length}）`);

    try {
      const imageUrl = getOriginalImageUrl(imageData.url);
      const imagePath = new URL(imageData.url).pathname.split('/').pop() || `image-${index + 1}`;
      const result = await processImage(
        { name: `${getArticleName(articleData)}_${imagePath}.jpg`, url: imageUrl },
        options.download,
      );
      const alt = options.getAlt ? altTexts[index]?.trim() : '';
      images.push(`${formatImageHtml(result)}${alt ? `\nALT: ${escapeHtml(alt)}` : ''}`);
    } catch (error) {
      throw toCopyStageError('image', '图片获取失败', error);
    }
  }
  return images;
}

export async function processScreenshot(
  screenshotBase64: string,
  articleDataList: ArticleData[],
  options: TweetCopyOptions,
): Promise<string> {
  if (!screenshotBase64) return '';

  try {
    const firstArticle = articleDataList[0];
    const name = firstArticle ? `${getArticleName(firstArticle)}.jpg` : 'tweet-screenshot.jpg';
    const result = await processImage({ name, url: screenshotBase64 }, options.download);
    return formatImageHtml(result);
  } catch (error) {
    throw toCopyStageError('screenshot', '截图获取失败', error);
  }
}
