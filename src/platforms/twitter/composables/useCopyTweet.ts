import { appState } from '../../../shared/store';
import { sleep, toCopyStageError, translateTextContents, waitATick } from '../../../shared/utils';
import { platformState } from '../platform';
import { extractTweetTextContent, getTweetTime, getTweetUserName } from '../utils';
import {
  captureArticleScreenshot,
  collectArticleImageData,
  processArticleImages,
  processScreenshot,
  type ArticleData,
  type TweetCopyOptions,
} from './tweetMedia';

const TEXT_SEPARATOR = '\n---------------\n';

function readTweetCopyOptions(): TweetCopyOptions {
  return {
    translate: platformState.configBar.translate,
    captureScreenshot: platformState.configBar.captureScreenshot,
    copyImages: platformState.configBar.copyImages,
    getAlt: platformState.configBar.getAlt,
    download: platformState.configBar.download,
    suffix: appState.options.suffix,
  };
}

export async function collectArticleData(
  article: HTMLElement,
  options: TweetCopyOptions,
): Promise<ArticleData> {
  article.querySelector<HTMLElement>('button[data-testid="tweet-text-show-more-link"]')?.click();
  await waitATick();

  const textElement = article.querySelector<HTMLElement>('div[data-testid="tweetText"]');
  const quotedTweetContainer = article.querySelector('div[aria-labelledby]');
  const textContent =
    textElement && !quotedTweetContainer?.contains(textElement)
      ? extractTweetTextContent(textElement)
      : '';

  return {
    userName: getTweetUserName(article),
    time: getTweetTime(article).toISOString(),
    textContent,
    imageDataList: options.copyImages ? await collectArticleImageData(article, options.getAlt) : [],
  };
}

export async function collectArticlesData(
  articleList: HTMLElement[],
  options: TweetCopyOptions,
): Promise<ArticleData[]> {
  const articleDataList: ArticleData[] = [];
  for (const article of articleList) {
    article.scrollIntoView({ behavior: 'instant', block: 'center' });
    await sleep(200);
    articleDataList.push(await collectArticleData(article, options));
  }
  return articleDataList;
}

export function formatArticleTexts(
  articleDataList: ArticleData[],
  contents: string[],
  separator: string,
  suffix: string,
): string {
  if (articleDataList.length === 0) return '';

  const text = articleDataList
    .map((articleData, index) => {
      const content = contents[index] ?? '';
      const header = `${articleData.userName} · ${new Date(articleData.time).toLocaleString()}`;
      return `${header}${content ? '\n' : ''}${content}`;
    })
    .join(separator);

  return suffix.trim() ? `${text}\n${suffix.trim()}` : text;
}

export async function processArticleTexts(
  articleDataList: ArticleData[],
  options: TweetCopyOptions,
): Promise<string> {
  try {
    const contents = await translateTextContents(
      articleDataList.map((articleData) => articleData.textContent),
      options.translate,
    );
    return formatArticleTexts(articleDataList, contents, TEXT_SEPARATOR, options.suffix);
  } catch (error) {
    throw toCopyStageError('translation', '文本翻译失败', error);
  }
}

export async function copyTweet(articleList: HTMLElement[]): Promise<string> {
  const options = readTweetCopyOptions();

  appState.loading.text = '正在读取推文内容';

  let articleDataList: ArticleData[];
  try {
    articleDataList = await collectArticlesData(articleList, options);
  } catch (error) {
    throw toCopyStageError('text', '推文文本获取失败', error);
  }

  let screenshotBase64 = '';
  if (options.captureScreenshot) {
    appState.loading.text = '正在获取截图';
    try {
      screenshotBase64 = await captureArticleScreenshot(articleList);
    } catch (error) {
      throw toCopyStageError('screenshot', '截图获取失败', error);
    }
  }

  if (options.translate) appState.loading.text = '正在翻译文本';
  const text = await processArticleTexts(articleDataList, options);

  const screenshot = options.captureScreenshot
    ? await processScreenshot(screenshotBase64, articleDataList, options)
    : '';
  const images = options.copyImages
    ? await processArticleImages(articleDataList, options, (message) => {
        appState.loading.text = message;
      })
    : [];

  return [text, screenshot, ...images].filter(Boolean).join('\n');
}
