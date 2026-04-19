import { appState } from "../store";

declare const htmlToImage: {
    toPng: (node: HTMLElement, options?: { backgroundColor?: string }) => Promise<string>;
};

export async function copyTweet(article: HTMLElement): Promise<string> {
    const copyContentList: string[] = [];

    const [hideVideo, showVideo] = initCorsVideoTemporaryStorage(article);
    await setVideoSize(article);
    await hideVideo();

    const divList = Array.from(article.querySelectorAll("div")) as HTMLElement[];

    const userNameDiv = divList.find((div) => div.dataset.testid === "User-Name");
    const userName = userNameDiv?.children[1]?.textContent?.split("\n")[0] || "unknown";

    appState.loading.text = "正在获取截图";
    const articleScreenShotBase64 = await htmlToImage.toPng(article, { backgroundColor: "white" });

    const timeElement = article.querySelector("a > time");
    let timeStr = timeElement ? new Date(timeElement.getAttribute("datetime")!).toLocaleString() : new Date().toLocaleDateString();
    timeStr = timeStr.replaceAll("/", "-").replaceAll(":", "");

    const tweetName = `${userName}_${timeStr}`;

    const localScreenShot = await getLocalImage([
        {
            name: `${tweetName}.jpg`,
            url: articleScreenShotBase64,
        },
    ]);
    copyContentList.push(`<img src="${localScreenShot}"/>`);

    const textDiv = divList.find((div) => div.dataset.testid === "tweetText");
    if (textDiv) {
        const textContent = getTweetText(textDiv as HTMLElement);
        const copyType = (await chrome.storage.local.get("textCopyType")).textCopyType;

        if (copyType == null || copyType) {
            appState.loading.text = "正在翻译文本";
            const translatedText = await getOpenAITranslation(textContent);
            copyContentList.unshift(translatedText);
        } else {
            copyContentList.unshift(textContent);
        }
    }

    const ariaLabelledbyDiv = divList.find((item) => item.getAttribute("aria-labelledby"));
    const extraElement = ariaLabelledbyDiv?.children[0] as HTMLElement | undefined;
    const span = extraElement?.querySelector("span");

    if (ariaLabelledbyDiv && (!span || span.textContent === "ALT" || span.parentElement?.nodeName === "A")) {
        const imgElementList = Array.from(extraElement!.querySelectorAll("img"));
        let index = 1;
        for (const imgElement of imgElementList) {
            appState.loading.text = `正在获取图片（${index++}/${imgElementList.length}）`;
            const [baseUrl, search] = imgElement.src.split("?");
            const searchParam = new URLSearchParams(search);
            searchParam.set("name", "orig");

            const localImage = await getLocalImage([
                {
                    name: `${tweetName}_${baseUrl.split("/").pop()}.jpg`,
                    url: baseUrl + "?" + searchParam.toString(),
                },
            ]);
            copyContentList.push(`<img src="${localImage}"/>`);
        }
    }

    await showVideo();

    console.log(copyContentList);
    return copyContentList.join("\n");
}

async function setVideoSize(article: HTMLElement) {
    const videoElementList = Array.from(article.querySelectorAll("video"));
    if (videoElementList.length === 0) return;

    for (const videoElement of videoElementList) {
        videoElement.pause();
        videoElement.currentTime = 0;
    }

    await waitIdleCallBack();

    for (const videoElement of videoElementList) {
        const setAttri = videoElement.videoHeight > videoElement.videoWidth ? "width" : "height";
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

    await waitATick();
}

function initCorsVideoTemporaryStorage(article: HTMLElement) {
    let videoList = Array.from(article.querySelectorAll("video"));
    videoList = videoList.filter((video) => !!video.src);

    const temporaryStorage: { parent: HTMLElement; video: HTMLVideoElement; cover: HTMLImageElement }[] = [];

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

    return [hideVideo, showVideo] as const;
}

function waitIdleCallBack(): Promise<void> {
    return new Promise((res) => {
        requestIdleCallback(res);
    });
}

function setElementStyle(element: HTMLElement, option: Record<string, string>) {
    const keys = Object.keys(option);
    for (const key of keys) {
        (element.style as any)[key] = option[key];
    }
}

function getTweetText(tweetTextElement: HTMLElement): string {
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

function getLocalImage(data: { name: string; url: string }[]): Promise<string> {
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
    const data = await GMFetch(appState.options.baseUrl + "/chat/completions", fetchParam, "json");
    console.log(data);
    return data.choices[0].message.content;
}

function GMFetch(url: string, option: Record<string, unknown>, formatType: string): Promise<any> {
    console.log(url, option);
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: "GMFetch",
                url: url,
                option: option,
                formatType: formatType,
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

function waitATick(): Promise<void> {
    return new Promise((res) => {
        requestAnimationFrame(res);
    });
}
