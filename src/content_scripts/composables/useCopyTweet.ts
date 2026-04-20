import { appState } from "../store";
import { toPng } from "html-to-image";
import {
  waitIdleCallBack,
  waitATick,
  setElementStyle,
  sendChromeMessage,
  formatDateForFilename,
} from "../../utils";

const TESTID_USER_NAME = "User-Name";
const TESTID_TWEET_TEXT = "tweetText";
const ORIG_IMAGE_PARAM = "orig";
const TEXT_SEPARATOR = "\n\n---\n\n";

async function getLocalImage(
  data: { name: string; url: string }[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "downloadImageList",
        data: data,
      },
      (response) => {
        if (response.isSuccess) {
          resolve(response.pathList[0]);
        } else {
          reject(response.reason);
        }
      },
    );
  });
}

async function getBase64Image(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "fetchImageAsBase64",
        url: url,
      },
      (response) => {
        if (response.isSuccess) {
          resolve(response.data);
        } else {
          reject(response.reason);
        }
      },
    );
  });
}

async function processImage(
  data: { name: string; url: string },
  download: boolean,
): Promise<string> {
  if (download) {
    return await getLocalImage([data]);
  }
  if (data.url.startsWith("data:")) {
    return data.url;
  }
  return await getBase64Image(data.url);
}

async function getOpenAITranslation(text: string): Promise<string> {
  const fetchParam = {
    headers: {
      "content-type": "application/json",
      Authorization: "Bearer " + appState.options.apiKey,
    },
    method: "POST",
    body: JSON.stringify({
      model: appState.options.model,
      messages: [
        { role: "system", content: appState.options.systemMessage },
        { role: "user", content: text },
      ],
      ...appState.options.otherParam,
    }),
  };
  const data = await sendChromeMessage("GMFetch", {
    url: appState.options.baseUrl + "/chat/completions",
    option: fetchParam,
    formatType: "json",
  });
  return data.choices[0].message.content;
}

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

async function captureScreenshots(
  articleList: HTMLElement[],
  tweetName: string,
): Promise<string> {
  appState.loading.text = "正在获取截图";

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;display:flex;flex-direction:column;background:white;";
  document.body.appendChild(container);

  for (const article of articleList) {
    const clone = article.cloneNode(true) as HTMLElement;
    clone.style.cssText = "width:" + article.offsetWidth + "px;";
    container.appendChild(clone);
  }

  await waitATick();

  const screenshotBase64 = await toPng(container, { backgroundColor: "white" });
  container.remove();

  const src = await processImage(
    { name: `${tweetName}.jpg`, url: screenshotBase64 },
    appState.configBar.download,
  );
  return `<img src="${src}"/>`;
}

async function extractTweetTexts(articleList: HTMLElement[]): Promise<string> {
  const textDivs = articleList
    .map((article) => {
      const divList = Array.from(
        article.querySelectorAll("div"),
      ) as HTMLElement[];
      return divList.find((div) => div.dataset.testid === TESTID_TWEET_TEXT);
    })
    .filter((div): div is HTMLElement => !!div);

  if (textDivs.length === 0) return "";

  const textContents = textDivs.map((div) => extractTweetTextContent(div));
  const copyType = (await chrome.storage.local.get("textCopyType"))
    .textCopyType;

  if (copyType == null || copyType) {
    appState.loading.text = "正在翻译文本";
    const translatedTexts = await Promise.all(
      textContents.map((text) => getOpenAITranslation(text)),
    );
    return translatedTexts.join(TEXT_SEPARATOR);
  }

  return textContents.join(TEXT_SEPARATOR);
}

async function extractAllTweetImages(
  articleList: HTMLElement[],
  tweetName: string,
): Promise<string[]> {
  const allImages: string[] = [];
  let globalIndex = 1;
  let totalCount = 0;

  for (const article of articleList) {
    const divList = Array.from(
      article.querySelectorAll("div"),
    ) as HTMLElement[];
    const ariaLabelledbyDiv = divList.find((item) =>
      item.getAttribute("aria-labelledby"),
    );
    const extraElement = ariaLabelledbyDiv?.children[0] as
      | HTMLElement
      | undefined;
    if (extraElement) {
      totalCount += extraElement.querySelectorAll("img").length;
    }
  }

  for (const article of articleList) {
    const divList = Array.from(
      article.querySelectorAll("div"),
    ) as HTMLElement[];
    const images = await extractTweetImages(
      divList,
      tweetName,
      globalIndex,
      totalCount,
    );
    globalIndex += images.length;
    allImages.push(...images);
  }

  return allImages;
}

async function extractTweetImages(
  divList: HTMLElement[],
  tweetName: string,
  startIndex: number,
  totalCount: number,
): Promise<string[]> {
  const ariaLabelledbyDiv = divList.find((item) =>
    item.getAttribute("aria-labelledby"),
  );
  const extraElement = ariaLabelledbyDiv?.children[0] as
    | HTMLElement
    | undefined;
  const span = extraElement?.querySelector("span");

  if (!ariaLabelledbyDiv || !extraElement) return [];
  if (
    span &&
    span.textContent !== "ALT" &&
    span.parentElement?.nodeName !== "A"
  )
    return [];

  const imgElementList = Array.from(extraElement.querySelectorAll("img"));
  const images: string[] = [];
  let index = startIndex;

  for (const imgElement of imgElementList) {
    appState.loading.text = `正在获取图片（${index++}/${totalCount}）`;
    const [baseUrl, search] = imgElement.src.split("?");
    const searchParam = new URLSearchParams(search);
    searchParam.set("name", ORIG_IMAGE_PARAM);
    const imgUrl = baseUrl + "?" + searchParam.toString();

    const src = await processImage(
      { name: `${tweetName}_${baseUrl.split("/").pop()}.jpg`, url: imgUrl },
      appState.configBar.download,
    );
    images.push(`<img src="${src}"/>`);
  }

  return images;
}

function getTweetName(article: HTMLElement, divList: HTMLElement[]): string {
  const userNameDiv = divList.find(
    (div) => div.dataset.testid === TESTID_USER_NAME,
  );
  const userName =
    userNameDiv?.children[1]?.textContent?.split("\n")[0] || "unknown";

  const timeElement = article.querySelector("a > time");
  const date = timeElement
    ? new Date(timeElement.getAttribute("datetime")!)
    : new Date();
  const timeStr = formatDateForFilename(date);

  return `${userName}_${timeStr}`;
}

async function setVideoSize(articleList: HTMLElement[]) {
  for (const article of articleList) {
    const videoElementList = Array.from(article.querySelectorAll("video"));
    if (videoElementList.length === 0) continue;

    for (const videoElement of videoElementList) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }

  await waitIdleCallBack();

  for (const article of articleList) {
    const videoElementList = Array.from(article.querySelectorAll("video"));
    for (const videoElement of videoElementList) {
      const setAttri =
        videoElement.videoHeight > videoElement.videoWidth ? "width" : "height";
      setElementStyle(videoElement, {
        [setAttri]: "auto",
        position: "",
      });

      setElementStyle(videoElement.parentElement as HTMLElement, {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
      });
    }
  }

  await waitATick();
}

function initCorsVideoTemporaryStorage(articleList: HTMLElement[]) {
  let videoList: HTMLVideoElement[] = [];
  for (const article of articleList) {
    videoList = videoList.concat(Array.from(article.querySelectorAll("video")));
  }
  videoList = videoList.filter((video) => !!video.src);

  const temporaryStorage: {
    parent: HTMLElement;
    video: HTMLVideoElement;
    cover: HTMLImageElement;
  }[] = [];

  async function hideVideo() {
    for (const video of videoList) {
      const cover = document.createElement("img");
      cover.src = video.poster;
      cover.style.cssText = "object-fit: contain; width: 100%; height: 100%;";

      temporaryStorage.push({
        parent: video.parentElement as HTMLElement,
        video: video,
        cover: cover,
      });

      video.parentElement!.appendChild(cover);
      video.remove();
    }
    await waitATick();
  }

  async function showVideo() {
    for (const item of temporaryStorage) {
      item.cover.remove();
      item.parent.appendChild(item.video);
    }
    await waitATick();
  }

  return { hideVideo, showVideo };
}

export async function copyTweet(articleList: HTMLElement[]): Promise<string> {
  const { hideVideo, showVideo } = initCorsVideoTemporaryStorage(articleList);
  await setVideoSize(articleList);
  await hideVideo();

  const firstArticle = articleList[0];
  const divList = Array.from(
    firstArticle.querySelectorAll("div"),
  ) as HTMLElement[];
  const tweetName = getTweetName(firstArticle, divList);

  const copyContentList: string[] = [];

  const text = await extractTweetTexts(articleList);
  if (text) {
    copyContentList.push(text);
  }

  const screenshot = await captureScreenshots(articleList, tweetName);
  copyContentList.push(screenshot);

  const images = await extractAllTweetImages(articleList, tweetName);
  copyContentList.push(...images);

  await showVideo();

  return copyContentList.join("\n");
}
