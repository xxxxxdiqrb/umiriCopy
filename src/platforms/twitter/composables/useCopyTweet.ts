import { appState } from "../../../shared/store";
import { platformState } from "../platform";
import { getOpenAITranslation, waitATick } from "../../../shared/utils";
import { captureScreenshots, extractAllTweetImages } from "./tweetMedia";
import { setVideoSize } from "./videoHandler";
import { getTweetName, getTweetTime, getTweetUserName } from "../utils";

const TEXT_SEPARATOR = "\n---------------\n";

function extractTweetTextContent(tweetTextElement: HTMLElement): string {
  const childrenList = Array.from(tweetTextElement.children);
  let textContent = "";
  for (const children of childrenList) {
    if (children.nodeName === "IMG") {
      textContent += (children as HTMLImageElement).alt;
    } else {
      textContent += (children as HTMLElement).innerText;
    }
  }
  return textContent;
}

async function extractTweetTexts(articleList: HTMLElement[]): Promise<string> {
  const textContents = [];
  for (const article of articleList) {
    const textDiv = article.querySelector('div[data-testid="tweetText"]') as HTMLElement | null;
    if (!textDiv || article.querySelector("div[aria-labelledby")?.contains(textDiv)) {
      continue;
    }
    const userName = getTweetUserName(article);
    const time = getTweetTime(article);
    textContents.push(`${userName} · ${time.toLocaleString()}\n${extractTweetTextContent(textDiv)}`);
  }

  if (textContents.length === 0) return "";

  if (platformState.configBar.translate) {
    appState.loading.text = "正在翻译文本";
    const sourceText = textContents.join(TEXT_SEPARATOR);
    const translatedText = await getOpenAITranslation(sourceText);
    return translatedText;
  }

  return textContents.join(TEXT_SEPARATOR);
}

export async function copyTweet(articleList: HTMLElement[]): Promise<string> {
  const { removeOverlay } = await setVideoSize(articleList);

  const copyContentList: string[] = [];

  for (const article of articleList) {
    article.querySelector<HTMLElement>('button[data-testid="tweet-text-show-more-link"]')?.click();
  }
  await waitATick();

  const text = await extractTweetTexts(articleList);
  if (text) {
    copyContentList.push(text);
  }

  const screenshot = await captureScreenshots(articleList, getTweetName(articleList[0]));
  copyContentList.push(screenshot);

  if (platformState.configBar.copyImages) {
    const images = await extractAllTweetImages(articleList);
    copyContentList.push(...images);
  }

  await removeOverlay();

  return copyContentList.join("\n");
}
