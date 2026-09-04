import { buildFileName } from '../../../shared/utils';
import type { ArticleImageData } from '../../../shared/copy/types';
import { getTweetTime, getTweetUserScreenName } from '../utils';

function setImageQuality(url: string, quality: string): string {
  const urlObj = new URL(url);
  urlObj.searchParams.set('name', quality);
  return urlObj.toString();
}

export async function collectArticleImageData(
  article: HTMLElement,
  includeAlt: boolean,
): Promise<ArticleImageData[]> {
  const media = article.querySelector<HTMLElement>('div[aria-labelledby]')?.children[0] as
    HTMLElement | undefined;
  if (!media || media.querySelector('time')) return [];

  const imageLinks = Array.from(media.querySelectorAll('a[href*="/photo/"]'));
  const userName = getTweetUserScreenName(article);
  const date = getTweetTime(article);
  const result: ArticleImageData[] = [];
  for (let index = 0; index < imageLinks.length; index++) {
    const imageLink = imageLinks[index];
    const image = imageLink.querySelector<HTMLImageElement>('img');
    if (!image) continue;
    const url = setImageQuality(image.src, 'orig');
    const path = new URL(url).pathname.split('/').pop() || `image_${index + 1}`;
    const extensionMatch = path.match(/\.([^.]+)$/);
    const fileName = extensionMatch ? path.slice(0, -extensionMatch[0].length) : path;
    const imageName = buildFileName(userName, date, fileName, 'jpg');
    const hasAltNode = Array.from(imageLink.parentElement?.querySelectorAll('span') || []).some(
      (item) => item.textContent === 'ALT',
    );
    const alt = includeAlt && hasAltNode ? image.alt : '';
    result.push({ alt, url, imageName });
  }

  return result;
}
