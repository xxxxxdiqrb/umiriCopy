import {
  formatDateForFilename,
  composeCopyContent,
  type ProcessImageResult,
  toCopyStageError,
  translateTextContents,
  type TranslationOptions,
} from '../utils';
import type { LoadingTextReporter } from '../composables/usePlatformCopy';
import type {
  ArticleData,
  PlatformAdapter,
  CopyPipelineOptions,
  ProcessedArticleData,
} from './types';
import { CopyStage } from './errors';
import { processArticleImages, processScreenshot } from './mediaProcessor';

export async function executeCopyPipeline(
  articles: HTMLElement[],
  adapter: PlatformAdapter,
  options: CopyPipelineOptions,
  translationOptions: TranslationOptions,
  reportLoadingText: LoadingTextReporter,
): Promise<string> {
  reportLoadingText('正在读取内容');
  let articleDataList: ArticleData[];
  try {
    articleDataList = await adapter.collectArticlesData(articles, options);
  } catch (error) {
    throw toCopyStageError(CopyStage.Collect, `${adapter.platform} 内容获取失败`, error);
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
      translatedTextContentList = await translateTextContents(textContentList, translationOptions);
      if (altTextList.length) {
        reportLoadingText('正在翻译ALT');
        translatedAltTextList = await translateTextContents(altTextList, translationOptions);
      }
    } catch (error) {
      throw toCopyStageError(CopyStage.Translation, '文本翻译失败', error);
    }
  }

  let processedImageResultList: ProcessImageResult[] = [];
  if (options.copyImages) {
    try { processedImageResultList = await processArticleImages(
      imageDataList,
      options.download,
      ({ current, total }) => reportLoadingText(`正在获取图片（${current}/${total}）`),
    ); } catch (error) { throw toCopyStageError(CopyStage.Image, '图片获取失败', error); }
  }
  let translatedAltIndex = 0;
  let flatImageIndex = 0;
  const processedArticleDataList: ProcessedArticleData[] = articleDataList.map(
    (articleData, articleIndex) => ({
      ...articleData,
      textContent: translatedTextContentList[articleIndex] ?? articleData.textContent,
      imageDataList: articleData.imageDataList.map((imageData) => ({
        ...imageData,
        alt: imageData.alt.trim()
          ? (translatedAltTextList[translatedAltIndex++] ?? imageData.alt)
          : imageData.alt,
        result: processedImageResultList[flatImageIndex++],
      })),
    }),
  );

  let screenshot = '';
  if (options.captureScreenshot && adapter.captureScreenshot) {
    try {
      reportLoadingText('正在获取截图');
      const base64 = await adapter.captureScreenshot(articles);
      const first = articleDataList[0];
      const name = first
        ? `${first.userName}_${formatDateForFilename(new Date(first.time))}_${adapter.platform}Screenshot.jpg`
        : `${adapter.platform}Screenshot.jpg`;
      screenshot = await processScreenshot(base64, name, options.download);
    } catch (error) {
      throw toCopyStageError(CopyStage.Screenshot, '截图获取失败', error);
    }
  }
  return composeCopyContent(processedArticleDataList, screenshot, options.suffix);
}
