import { appState } from "../store";
import { BATCH_TRANSLATION_SYSTEM_MESSAGE } from "../constants";

export interface TranslationTextItem {
  header: string;
  content: string;
}

type ChatMessage = {
  role: "system" | "user";
  content: string;
};

function createChatCompletionRequest(messages: ChatMessage[], parameters: Record<string, unknown> = {}) {
  return {
    headers: {
      "content-type": "application/json",
      Authorization: "Bearer " + appState.options.apiKey,
    },
    method: "POST",
    body: JSON.stringify({
      ...appState.options.otherParam,
      model: appState.options.model,
      messages,
      ...parameters,
      stream: false,
    }),
  };
}

async function requestChatCompletion(messages: ChatMessage[], parameters: Record<string, unknown> = {}) {
  return sendChromeMessage("GMFetch", {
    url: appState.options.baseUrl + "/chat/completions",
    option: createChatCompletionRequest(messages, parameters),
    formatType: "json",
  });
}

function cleanMarkdownJson(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new Error("模型未返回有效文本内容");
  }
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return cleaned;
}

function getResponseContent(data: any): string {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("模型未返回有效译文");
  }
  return content;
}

function parseTranslationList(raw: unknown, expectedLength: number): string[] {
  const parsed: unknown = JSON.parse(cleanMarkdownJson(raw));
  const list = Array.isArray(parsed) ? parsed : (parsed as { translations?: unknown })?.translations;
  if (!Array.isArray(list) || list.length !== expectedLength || list.some((item) => typeof item !== "string")) {
    throw new Error("返回格式或元素数量不匹配");
  }
  return list;
}

async function translateWithConcurrency(contents: string[], concurrency = 4): Promise<string[]> {
  const translated = [...contents];
  for (let index = 0; index < contents.length; index += concurrency) {
    const chunk = contents.slice(index, index + concurrency);
    const chunkResult = await Promise.all(chunk.map((text) => (text.trim() ? getOpenAITranslation(text) : Promise.resolve(text))));
    translated.splice(index, chunkResult.length, ...chunkResult);
  }
  return translated;
}

export async function getOpenAITranslation(text: string): Promise<string> {
  if (!text || !text.trim()) return text;
  const data = await requestChatCompletion([
    { role: "system", content: appState.options.systemMessage },
    { role: "user", content: text },
  ]);
  return getResponseContent(data);
}

export async function translateTextItems(items: TranslationTextItem[], translate: boolean, separator: string): Promise<string> {
  if (items.length === 0) return "";
  let contents = items.map((item) => item.content);

  if (translate) {
    const isBatch = appState.options.batchTranslation && items.length > 1;

    if (!isBatch) {
      // 逐条纯文本翻译（单条直通或多条并发 Promise.all）
      contents = await translateWithConcurrency(contents);
    } else if (appState.options.enableJsonSchema) {
      // 批量 + JSON Schema 结构化输出
      const data = await requestChatCompletion(
        [
          { role: "system", content: appState.options.systemMessage },
          { role: "system", content: BATCH_TRANSLATION_SYSTEM_MESSAGE },
          { role: "user", content: JSON.stringify(contents) },
        ],
        { response_format: { type: "json_object" } },
      );

      try {
        contents = parseTranslationList(getResponseContent(data), items.length);
      } catch (err) {
        throw new Error(`LLM 结构化输出解析失败: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      // 批量 + System Message 约束输出
      const data = await requestChatCompletion([
        { role: "system", content: appState.options.systemMessage },
        { role: "system", content: appState.options.jsonSystemMessage },
        { role: "user", content: JSON.stringify(contents) },
      ]);

      try {
        contents = parseTranslationList(getResponseContent(data), items.length);
      } catch (err) {
        throw new Error(`LLM 返回 JSON 格式错误: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  const resultText = items.map((item, index) => `${item.header}${contents[index] ? "\n" : ""}${contents[index]}`).join(separator);
  if (translate && appState.options.suffix?.trim()) {
    return `${resultText}\n${appState.options.suffix.trim()}`;
  }
  return resultText;
}

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

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  return date.toLocaleString().split("/").join("-").split(":").join("");
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

export async function processImage(data: { name: string; url: string }, download: boolean): Promise<ProcessImageResult> {
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

export interface DownloadVideoOptions {
  withCredentials?: boolean;
}

export function downloadVideoWithProgress(
  url: string,
  filename: string,
  onProgress: (percent: number) => void,
  options?: DownloadVideoOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    if (options?.withCredentials) {
      xhr.withCredentials = true;
    }

    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response;
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(downloadUrl);
        resolve();
      } else {
        reject(new Error(`下载失败: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("网络错误"));
    xhr.send();
  });
}
