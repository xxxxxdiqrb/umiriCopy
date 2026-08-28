import { appState } from '../../../shared/store';
import { platformState } from '../platform';
import {
  translateTextItems,
  waitATick,
  type TranslationTextItem,
  toCopyStageError,
} from '../../../shared/utils';
import { captureScreenshots, extractAllTweetImages } from './tweetMedia';
import { setVideoSize } from './videoHandler';
import { extractTweetTextContent, getTweetName, getTweetTime, getTweetUserName } from '../utils';

const TEXT_SEPARATOR = '\n---------------\n';

async function extractTweetTexts(articleList: HTMLElement[]): Promise<string> {
  const textContents: TranslationTextItem[] = [];
  for (const article of articleList) {
    const textDiv = article.querySelector('div[data-testid="tweetText"]') as HTMLElement | null;
    let content = '';
    if (textDiv && !article.querySelector('div[aria-labelledby')?.contains(textDiv)) {
      content = extractTweetTextContent(textDiv);
    }
    const userName = getTweetUserName(article);
    const time = getTweetTime(article);
    textContents.push({ header: `${userName} · ${time.toLocaleString()}`, content: content });
  }
  if (platformState.configBar.translate) appState.loading.text = '正在翻译文本';
  try {
    return await translateTextItems(
      textContents,
      platformState.configBar.translate,
      TEXT_SEPARATOR,
    );
  } catch (error) {
    throw toCopyStageError('translation', '文本翻译失败', error);
  }
}

export async function copyTweet(articleList: HTMLElement[]): Promise<string> {
  const { removeOverlay } = await setVideoSize(articleList);
  try {
    const copyContentList: string[] = [];
    for (const article of articleList)
      article
        .querySelector<HTMLElement>('button[data-testid="tweet-text-show-more-link"]')
        ?.click();
    await waitATick();
    let text: string;
    try {
      text = await extractTweetTexts(articleList);
    } catch (error) {
      throw toCopyStageError('text', '推文文本获取失败', error);
    }
    if (text) copyContentList.push(text);
    if (platformState.configBar.captureScreenshot)
      copyContentList.push(await captureScreenshots(articleList, getTweetName(articleList[0])));
    if (platformState.configBar.copyImages)
      copyContentList.push(...(await extractAllTweetImages(articleList)));
    return copyContentList.join('\n');
  } finally {
    await removeOverlay();
  }
}
