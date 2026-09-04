import { sleep } from '../../../shared/utils';
import type { ArticleData, CopyPipelineOptions } from '../../../shared/copy/types';
import { collectArticleImageData } from './imageCollector';
import { getShortcode } from '../utils';
import { getMediaInfoByShortcode } from '../services/instagramApi';

async function collectArticleData(
  article: HTMLElement,
  options: Pick<CopyPipelineOptions, 'copyImages' | 'getAlt'>,
): Promise<ArticleData> {
  const detail = await getMediaInfoByShortcode(getShortcode(article));
  if (!detail) throw new Error('获取 Instagram 帖子信息失败');
  return {
    userName: detail.user.fullName || detail.user.username,
    userScreenName: detail.user.username,
    time: new Date(detail.createdAt * 1000).toISOString(),
    textContent: detail.caption.text,
    imageDataList: options.copyImages ? collectArticleImageData(detail) : [],
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

export { collectArticleData };
