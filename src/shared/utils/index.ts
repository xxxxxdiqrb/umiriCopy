export function createElement<T extends Element = Element>(htmlString: string): T {
    const range = document.createRange();
    return range.createContextualFragment(htmlString).children[0] as T;
}

export function waitIdleCallBack(): Promise<void> {
    return new Promise((res) => {
        requestIdleCallback(() => res());
    });
}

export function waitATick(): Promise<void> {
    return new Promise((res) => {
        requestAnimationFrame(() => res());
    });
}

export function setElementStyle(element: HTMLElement, option: Record<string, string>) {
    const keys = Object.keys(option);
    for (const key of keys) {
        (element.style as any)[key] = option[key];
    }
}

export function sendChromeMessage<T = any>(type: string, data: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type, ...data }, (response) => {
            if (response.isSuccess) {
                resolve(response.data ?? response.pathList?.[0]);
            } else {
                reject(response.reason);
            }
        });
    });
}

export function formatDateForFilename(date: Date): string {
    return date
        .toLocaleString()
        .split("/")
        .join("-")
        .split(":")
        .join("");
}

export async function getBase64Image(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "fetchImageAsBase64", url }, (response) => {
            if (response.isSuccess) {
                resolve(response.data);
            } else {
                reject(response.reason);
            }
        });
    });
}

export async function getLocalImage(data: { name: string; url: string }[]): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "downloadImageList", data }, (response) => {
            if (response.isSuccess) {
                resolve(response.pathList[0]);
            } else {
                reject(response.reason);
            }
        });
    });
}

export interface ProcessImageResult {
    displaySrc: string;
    originalSrc?: string;
}

export async function processImage(
    data: { name: string; url: string },
    download: boolean,
): Promise<ProcessImageResult> {
    if (download) {
        const localPath = await getLocalImage([data]);
        if (data.url.startsWith("data:")) {
            return { displaySrc: data.url, originalSrc: localPath };
        }
        try {
            const base64 = await getBase64Image(data.url);
            return { displaySrc: base64, originalSrc: localPath };
        } catch {
            return { displaySrc: localPath, originalSrc: localPath };
        }
    }
    if (data.url.startsWith("data:")) {
        return { displaySrc: data.url };
    }
    const base64 = await getBase64Image(data.url);
    return { displaySrc: base64 };
}

export function formatImageHtml(result: ProcessImageResult): string {
    if (result.originalSrc) {
        return `<img src="${result.displaySrc}" data-original-src="${result.originalSrc}"/>`;
    }
    return `<img src="${result.displaySrc}"/>`;
}
