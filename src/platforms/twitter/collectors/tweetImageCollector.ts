import { CopyStageError, formatDateForFilename, toCopyStageError } from '../../../shared/utils';
import type { ArticleImageData } from '../../../shared/copy/types';
import { extractTweetTextContent, getTweetTime, getTweetUserScreenName } from '../utils';

async function waitForDialog(show: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const check = () => {
      const exists = document.querySelector('div[data-testid="hoverCardParent"]') !== null;
      if (exists === show) resolve();
      else if (performance.now() - start >= 5000) reject(new Error('等待弹窗超时'));
      else requestAnimationFrame(check);
    };
    check();
  });
}

async function toggleAltDialog(): Promise<void> {
  const hover = document.querySelector('div[data-testid="hoverCardParent"]');
  const parent = hover?.parentElement;
  const target = parent && Array.from(parent.children).find((item) => item !== hover) as HTMLElement | undefined;
  target?.click();
  await waitForDialog(false);
}

async function getAltText(presentation: Element): Promise<string> {
  try {
    const button = Array.from(presentation.querySelectorAll('span')).find((item) => item.textContent === 'ALT');
    if (!button) return '';
    await toggleAltDialog(); button.click(); await waitForDialog(true);
    const text = document.querySelector('div[role="dialog"]')?.children?.[1];
    return text instanceof HTMLElement ? extractTweetTextContent(text) : '';
  } catch (error) {
    if (error instanceof CopyStageError) throw error;
    throw toCopyStageError('alt', '获取图片 ALT 文本失败', error);
  } finally {
    if (document.querySelector('div[data-testid="hoverCardParent"]')) await toggleAltDialog().catch(() => undefined);
  }
}

export async function collectArticleImageData(article: HTMLElement, includeAlt: boolean): Promise<ArticleImageData[]> {
  const media = article.querySelector<HTMLElement>('div[aria-labelledby]')?.children[0] as HTMLElement | undefined;
  if (!media || media.querySelector('time')) return [];
  const articleName = `${getTweetUserScreenName(article)}_${formatDateForFilename(getTweetTime(article))}`;
  const result: ArticleImageData[] = [];
  for (const presentation of Array.from(media.querySelectorAll('div[role="presentation"]')).filter((item) => !item.querySelector('video'))) {
    const image = presentation.querySelector<HTMLImageElement>('img');
    if (!image) continue;
    const path = new URL(image.src).pathname.split('/').pop() || `image_${result.length + 1}`;
    result.push({ url: image.src, alt: includeAlt ? await getAltText(presentation) : '', imageName: `${articleName}_${path}.jpg` });
  }
  return result;
}
