import { appState } from "../store";
import { sendChromeMessage, formatDateForFilename } from "../../utils";
import { captureScreenshots, extractAllTweetImages } from "./tweetMedia";
import { setVideoSize } from "./videoHandler";

const TESTID_USER_NAME = "User-Name";
const TESTID_TWEET_TEXT = "tweetText";
const TEXT_SEPARATOR = "\n---------------\n";

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

async function extractTweetTexts(articleList: HTMLElement[]): Promise<string> {
    const textDivs = articleList
        .map((article) => {
            const divList = Array.from(article.querySelectorAll("div")) as HTMLElement[];
            return divList.find((div) => div.dataset.testid === TESTID_TWEET_TEXT);
        })
        .filter((div): div is HTMLElement => !!div);

    if (textDivs.length === 0) return "";

    const textContents = textDivs.map((div) => extractTweetTextContent(div));

    if (appState.configBar.translate) {
        appState.loading.text = "正在翻译文本";
        const translatedTexts = await Promise.all(textContents.map((text) => getOpenAITranslation(text)));
        return translatedTexts.join(TEXT_SEPARATOR);
    }

    return textContents.join(TEXT_SEPARATOR);
}

function getTweetName(article: HTMLElement, divList: HTMLElement[]): string {
    const userNameDiv = divList.find((div) => div.dataset.testid === TESTID_USER_NAME);
    const userName = userNameDiv?.children[1]?.textContent?.split("\n")[0] || "unknown";

    const timeElement = article.querySelector("a > time");
    const date = timeElement ? new Date(timeElement.getAttribute("datetime")!) : new Date();
    const timeStr = formatDateForFilename(date);

    return `${userName}_${timeStr}`;
}

export async function copyTweet(articleList: HTMLElement[]): Promise<string> {
    const { removeOverlay } = await setVideoSize(articleList);

    const firstArticle = articleList[0];
    const divList = Array.from(firstArticle.querySelectorAll("div")) as HTMLElement[];
    const tweetName = getTweetName(firstArticle, divList);

    const copyContentList: string[] = [];

    const text = await extractTweetTexts(articleList);
    if (text) {
        copyContentList.push(text);
    }

    const screenshot = await captureScreenshots(articleList, tweetName);
    copyContentList.push(screenshot);

    if (appState.configBar.copyImages) {
        const images = await extractAllTweetImages(articleList, tweetName);
        copyContentList.push(...images);
    }

    await removeOverlay();

    return copyContentList.join("\n");
}
