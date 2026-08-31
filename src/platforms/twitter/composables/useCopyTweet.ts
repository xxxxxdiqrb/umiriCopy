import {
  formatDateForFilename,
  composeCopyContent,
  type ProcessImageResult,
  sleep,
  toCopyStageError,
  translateTextContents,
  waitATick,
} from '../../../shared/utils';
import type { LoadingTextReporter } from '../../../shared/composables/usePlatformCopy';
import { extractTweetTextContent, getTweetTime, getTweetUserName } from '../utils';
import {
  captureArticleScreenshot,
  collectArticleImageData,
  processArticleImages,
  processScreenshot,
  type ArticleData,
  type ProcessedArticleData,
  type TweetCopyOptions,
} from './tweetMedia';

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

export async function copyTweet(
  articleList: HTMLElement[],
  options: TweetCopyOptions,
  reportLoadingText: LoadingTextReporter,
): Promise<string> {
  reportLoadingText('正在读取推文内容');

  let articleDataList: ArticleData[];
  try {
    articleDataList = await collectArticlesData(articleList, options);
  } catch (error) {
    throw toCopyStageError('text', '推文文本获取失败', error);
  }

  let screenshotBase64 = '';
  if (options.captureScreenshot) {
    reportLoadingText('正在获取截图');
    try {
      screenshotBase64 = await captureArticleScreenshot(articleList);
    } catch (error) {
      throw toCopyStageError('screenshot', '截图获取失败', error);
    }
  }

  const textContentList = articleDataList.map(({ textContent }) => textContent);
  const imageDataList = articleDataList.flatMap(({ imageDataList }) => imageDataList);
  const altTextList = options.getAlt
    ? imageDataList.filter(({ alt }) => alt.trim()).map(({ alt }) => alt)
    : [];

  let translatedTextContentList: string[] = [];
  let translatedAltTextList: string[] = [];

  if (options.translate) {
    try {
      reportLoadingText('正在翻译文本');
      translatedTextContentList = await translateTextContents(textContentList, options.translate);
      reportLoadingText('正在翻译ALT');
      translatedAltTextList = await translateTextContents(altTextList, options.translate);
    } catch (error) {
      throw toCopyStageError('translation', '文本翻译失败', error);
    }
  }

  let processedImageResultList: ProcessImageResult[] = [];
  if (options.copyImages) {
    processedImageResultList = await processArticleImages(
      imageDataList,
      options.download,
      ({ current, total }) => {
        reportLoadingText(`正在获取图片（${current}/${total}）`);
      },
    );
  }

  const processedAltTextList: string[] = [];
  let translatedAltIndex = 0;
  for (const imageData of imageDataList) {
    processedAltTextList.push(
      imageData.alt.trim()
        ? (translatedAltTextList[translatedAltIndex++] ?? imageData.alt)
        : imageData.alt,
    );
  }
  let flatImageIndex = 0;
  const processedArticleDataList: ProcessedArticleData[] = articleDataList.map(
    (articleData, articleIndex) => ({
      ...articleData,
      textContent: translatedTextContentList[articleIndex] ?? articleData.textContent,
      imageDataList: articleData.imageDataList.map((imageData) => {
        const currentImageIndex = flatImageIndex++;
        return {
          ...imageData,
          alt: processedAltTextList[currentImageIndex] ?? imageData.alt,
          result: processedImageResultList[currentImageIndex],
        };
      }),
    }),
  );

  const firstArticle = articleDataList[0];
  const screenshotName = firstArticle
    ? `${firstArticle.userName}_${formatDateForFilename(new Date(firstArticle.time))}_tweetScreenshot.jpg`
    : 'tweetScreenshot.jpg';
  const screenshot = options.captureScreenshot
    ? await processScreenshot(screenshotBase64, screenshotName, options.download)
    : '';

  return composeCopyContent(processedArticleDataList, screenshot, options.suffix);
}
