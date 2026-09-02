import { sleep, waitATick } from '../../../shared/utils';
import type { ArticleData, CopyPipelineOptions } from '../../../shared/copy/types';
import { extractTweetTextContent, getTweetTime, getTweetUserName, getTweetUserScreenName } from '../utils';
import { collectArticleImageData } from './tweetImageCollector';

export async function collectArticleData(
  article: HTMLElement,
  options: Pick<CopyPipelineOptions, 'copyImages' | 'getAlt'>,
): Promise<ArticleData> {
  article.querySelector<HTMLElement>('button[data-testid="tweet-text-show-more-link"]')?.click();
  await waitATick();
  const textElement = article.querySelector<HTMLElement>('div[data-testid="tweetText"]');
  const quotedTweetContainer = article.querySelector('div[aria-labelledby]');
  const textContent = textElement && !quotedTweetContainer?.contains(textElement)
    ? extractTweetTextContent(textElement) : '';
  return {
    userName: getTweetUserName(article),
    userScreenName: getTweetUserScreenName(article),
    time: getTweetTime(article).toISOString(),
    textContent,
    imageDataList: options.copyImages ? await collectArticleImageData(article, options.getAlt ?? false) : [],
  };
}

export async function collectArticlesData(
  articles: HTMLElement[],
  options: Pick<CopyPipelineOptions, 'copyImages' | 'getAlt'>,
): Promise<ArticleData[]> {
  const result: ArticleData[] = [];
  for (const article of articles) {
    article.scrollIntoView({ behavior: 'instant', block: 'center' });
    await sleep(200);
    result.push(await collectArticleData(article, options));
  }
  return result;
}
