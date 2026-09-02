import { formatDateForFilename } from '../../../shared/utils';
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
  const target =
    parent &&
    (Array.from(parent.children).find((item) => item !== hover) as HTMLElement | undefined);
  target?.click();
  await waitForDialog(false);
}

async function getAltText(presentation: Element): Promise<string> {
  try {
    const button = Array.from(presentation.querySelectorAll('span')).find(
      (item) => item.textContent === 'ALT',
    );
    if (!button) return '';
    await toggleAltDialog();
    button.click();
    await waitForDialog(true);
    const text = document.querySelector('div[role="dialog"]')?.children?.[1];
    return text instanceof HTMLElement ? extractTweetTextContent(text) : '';
  } finally {
    if (document.querySelector('div[data-testid="hoverCardParent"]'))
      await toggleAltDialog().catch(() => undefined);
  }
}

export async function collectArticleImageData(
  article: HTMLElement,
  includeAlt: boolean,
): Promise<ArticleImageData[]> {
  const media = article.querySelector<HTMLElement>('div[aria-labelledby]')?.children[0] as
    HTMLElement | undefined;
  if (!media || media.querySelector('time')) return [];
  const articleName = `${getTweetUserScreenName(article)}_${formatDateForFilename(getTweetTime(article))}`;
  const presentations = Array.from(media.querySelectorAll('div[role="presentation"]')).filter(
    (item) => !item.querySelector('video'),
  );
  const sources: Array<{ presentation: Element; url: string; imageName: string }> = [];

  // Collect URL and filename independently from ALT extraction.
  for (let index = 0; index < presentations.length; index++) {
    const presentation = presentations[index];
    const image = presentation.querySelector<HTMLImageElement>('img');
    if (!image) continue;
    let url: string;
    try {
      url = image.src;
      if (!url) throw new Error('图片 URL 为空');
    } catch (error) {
      throw new Error(`图片 URL 获取失败: ${String(error)}`);
    }
    let imageName: string;
    try {
      const path = new URL(url).pathname.split('/').pop() || `image_${index + 1}`;
      imageName = `${articleName}_${path}.jpg`;
    } catch (error) {
      throw new Error(`图片文件名生成失败: ${String(error)}`);
    }
    sources.push({ presentation, url, imageName });
  }

  const result: ArticleImageData[] = [];
  for (const source of sources) {
    let alt = '';
    if (includeAlt) {
      try {
        alt = await getAltText(source.presentation);
      } catch (error) {
        throw new Error(`ALT文本获取失败: ${String(error)}`);
      }
    }
    result.push({ url: source.url, imageName: source.imageName, alt });
  }
  return result;
}
