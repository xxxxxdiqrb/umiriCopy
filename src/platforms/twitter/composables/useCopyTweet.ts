import { appState } from "../../../shared/store";
import { platformState } from "../platform";
import { translateTextItems, waitATick, type TranslationTextItem } from "../../../shared/utils";
import { captureScreenshots, extractAllTweetImages } from "./tweetMedia";
import { setVideoSize } from "./videoHandler";
import { extractTweetTextContent, getTweetName, getTweetTime, getTweetUserName } from "../utils";

const TEXT_SEPARATOR = "\n---------------\n";

async function extractTweetTexts(articleList: HTMLElement[]): Promise<string> {
  const textContents: TranslationTextItem[] = [];
  for (const article of articleList) {
    const textDiv = article.querySelector('div[data-testid="tweetText"]') as HTMLElement | null;
    if (!textDiv || article.querySelector("div[aria-labelledby")?.contains(textDiv)) continue;
    const userName = getTweetUserName(article);
    const time = getTweetTime(article);
    textContents.push({ header: `${userName} · ${time.toLocaleString()}\n`, content: extractTweetTextContent(textDiv) });
  }
  if (platformState.configBar.translate) appState.loading.text = "正在翻译文本";
  return translateTextItems(textContents, platformState.configBar.translate, TEXT_SEPARATOR);
}

export async function copyTweet(articleList: HTMLElement[]): Promise<string> {
  const { removeOverlay } = await setVideoSize(articleList);
  const copyContentList: string[] = [];
  for (const article of articleList) article.querySelector<HTMLElement>('button[data-testid="tweet-text-show-more-link"]')?.click();
  await waitATick();
  const text = await extractTweetTexts(articleList);
  if (text) copyContentList.push(text);
  if (platformState.configBar.captureScreenshot) copyContentList.push(await captureScreenshots(articleList, getTweetName(articleList[0])));
  if (platformState.configBar.copyImages) copyContentList.push(...(await extractAllTweetImages(articleList)));
  await removeOverlay();
  return copyContentList.join("\n");
}
