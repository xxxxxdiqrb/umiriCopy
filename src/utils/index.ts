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
