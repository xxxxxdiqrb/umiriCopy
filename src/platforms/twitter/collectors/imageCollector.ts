import { formatDateForFilename } from '../../../shared/utils';
import type { ArticleImageData } from '../../../shared/copy/types';
import { getTweetTime, getTweetUserScreenName } from '../utils';

export async function collectArticleImageData(
  article: HTMLElement,
  includeAlt: boolean,
): Promise<ArticleImageData[]> {
  const media = article.querySelector<HTMLElement>('div[aria-labelledby]')?.children[0] as
    HTMLElement | undefined;
  if (!media || media.querySelector('time')) return [];

  const imageLinks = Array.from(media.querySelectorAll('a[href*="/photo/"]'));
  const articleName = `${getTweetUserScreenName(article)}_${formatDateForFilename(getTweetTime(article))}`;
  const result: ArticleImageData[] = [];
  for (let index = 0; index < imageLinks.length; index++) {
    const imageLink = imageLinks[index];
    const image = imageLink.querySelector<HTMLImageElement>('img');
    if (!image) continue;
    const url = image.src;
    const path = new URL(url).pathname.split('/').pop() || `image_${index + 1}`;
    const imageName = `${articleName}_${path}.jpg`;
    const hasAltNode = Array.from(imageLink.parentElement?.querySelectorAll('span') || []).some(
      (item) => item.textContent === 'ALT',
    );
    const alt = includeAlt && hasAltNode ? image.alt : '';
    result.push({ alt, url, imageName });
  }

  return result;
}
