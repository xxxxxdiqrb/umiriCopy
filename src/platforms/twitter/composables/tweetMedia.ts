import { appState } from '../../../shared/store';
import { platformState } from '../platform';
import { toPng } from 'html-to-image';
import {
  processImage,
  formatImageHtml,
  sleep,
  translateTextContents,
  CopyStageError,
  toCopyStageError,
} from '../../../shared/utils';
import { extractTweetTextContent, getTweetName } from '../utils';

const ORIG_IMAGE_PARAM = 'orig';

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function captureScreenshots(articleList: HTMLElement[], tweetName: string): Promise<string> {
  appState.loading.text = '正在获取截图';
  try {
    const screenshots: string[] = [];
    for (const article of articleList) {
      const dataUrl = await toPng(article, { backgroundColor: 'white' });
      screenshots.push(dataUrl);
    }

    const imageElements = await Promise.all(screenshots.map(loadImage));
    const totalHeight = imageElements.reduce((sum, img) => sum + img.naturalHeight, 0);
    const maxWidth = Math.max(...imageElements.map((img) => img.naturalWidth));

    const canvas = document.createElement('canvas');
    canvas.width = maxWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let yOffset = 0;
    for (const img of imageElements) {
      const x = (maxWidth - img.naturalWidth) / 2;
      ctx.drawImage(img, x, yOffset);
      yOffset += img.naturalHeight;
    }

    const mergedBase64 = canvas.toDataURL('image/png');
    const result = await processImage(
      { name: `${tweetName}.jpg`, url: mergedBase64 },
      platformState.configBar.download,
    );
    return formatImageHtml(result);
  } catch (error) {
    throw toCopyStageError('screenshot', '截图获取失败', error);
  }
}

export interface TweetImageEntry {
  element: HTMLImageElement;
  alt: string;
}

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

async function displayDialog() {
  const hoverCard = document.querySelector('div[data-testid="hoverCardParent"]');
  const parent = hoverCard?.parentElement;
  if (!parent) {
    return;
  }
  // 这里应该是有clickOutSide的逻辑，如果失效了就再找对应节点
  const clickTarget = Array.from(parent.children).find(
    (item): item is HTMLElement => item !== hoverCard && item instanceof HTMLElement,
  );
  if (!clickTarget) {
    return;
  }
  clickTarget.click();
  await waitForDialog(false);
}

async function waitForDialog(showDialog: boolean) {
  return new Promise<void>((res, reject) => {
    const startTime = performance.now();
    judge();

    function judge() {
      const hasDialog = document.querySelector('div[data-testid="hoverCardParent"]') != null;
      if ((showDialog && hasDialog) || (!showDialog && !hasDialog)) {
        res();
      } else if (performance.now() - startTime >= 5000) {
        reject(new Error(`等待弹窗${showDialog ? '显示' : '关闭'}超时`));
      } else {
        requestAnimationFrame(judge);
      }
    }
  });
}

async function getImageEntryList(
  article: HTMLElement,
  includeAlt = platformState.configBar.getAlt,
): Promise<TweetImageEntry[]> {
  const ariaLabelledbyDiv = article.querySelector<HTMLElement>('div[aria-labelledby]');
  const extraElement = ariaLabelledbyDiv?.children[0] as HTMLElement | undefined;

  if (!ariaLabelledbyDiv || !extraElement) return [];

  // 防止将引用块当成图片块
  const time = extraElement.querySelector('time');
  if (time) return [];

  // 有视频的部分会把视频的预览图也获取到，先这样处理看看
  const presentationList = Array.from(extraElement.querySelectorAll('div[role="presentation"]'));
  if (presentationList.length > 0) {
    const imagePresentationList = presentationList.filter((item) => !item.querySelector('video'));
    const entries: TweetImageEntry[] = [];
    for (const presentation of imagePresentationList) {
      const element = presentation.querySelector<HTMLImageElement>('img');
      if (element) {
        entries.push({ element, alt: includeAlt ? await getAltText(presentation) : '' });
      }
    }
    return entries;
  }

  const entries: TweetImageEntry[] = [];
  for (const element of Array.from(extraElement.querySelectorAll<HTMLImageElement>('img'))) {
    entries.push({ element, alt: includeAlt ? await getAltText(extraElement) : '' });
  }
  return entries;
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

async function extractTweetImages(
  article: HTMLElement,
  tweetName: string,
  startIndex: number,
  totalCount: number,
): Promise<string[]> {
  const imageEntryList = await getImageEntryList(article);
  let altTexts = imageEntryList.map(({ alt }) => alt);
  if (
    platformState.configBar.getAlt &&
    platformState.configBar.translate &&
    altTexts.some((text) => text.trim())
  ) {
    appState.loading.text = '正在翻译ALT';
    try {
      altTexts = await translateTextContents(altTexts, true);
    } catch (error) {
      throw toCopyStageError('alt', 'ALT 文本翻译失败', error);
    }
  }

  const images: string[] = [];
  let index = startIndex;

  for (let entryIndex = 0; entryIndex < imageEntryList.length; entryIndex++) {
    const { element: imgElement } = imageEntryList[entryIndex];
    appState.loading.text = `正在获取图片（${index++}/${totalCount}）`;
    const [baseUrl, search] = imgElement.src.split('?');
    const searchParam = new URLSearchParams(search);
    searchParam.set('name', ORIG_IMAGE_PARAM);
    const imgUrl = baseUrl + '?' + searchParam.toString();

    let result;
    try {
      result = await processImage(
        { name: `${tweetName}_${baseUrl.split('/').pop()}.jpg`, url: imgUrl },
        platformState.configBar.download,
      );
    } catch (error) {
      throw toCopyStageError('image', '图片获取失败', error);
    }
    const alt = platformState.configBar.getAlt ? altTexts[entryIndex]?.trim() : '';
    images.push(`${formatImageHtml(result)}${alt ? `\nALT: ${escapeHtml(alt)}` : ''}`);
  }

  return images;
}

async function extractAllTweetImages(articleList: HTMLElement[]): Promise<string[]> {
  const allImages: string[] = [];
  let globalIndex = 1;
  let totalCount = 0;

  for (const article of articleList) {
    totalCount += (await getImageEntryList(article, false)).length;
  }

  for (const article of articleList) {
    article.scrollIntoView({ behavior: 'instant', block: 'center' });
    await sleep(200);
    const tweetName = getTweetName(article);
    const images = await extractTweetImages(article, tweetName, globalIndex, totalCount);
    globalIndex += images.length;
    allImages.push(...images);
  }

  return allImages;
}

export { captureScreenshots, extractAllTweetImages };
