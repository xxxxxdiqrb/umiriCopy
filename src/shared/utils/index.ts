import type { LLMProvider, LLMProtocol } from '../../options/types';
import { BATCH_TRANSLATION_SYSTEM_MESSAGE } from '../constants';
import { requestLLM } from '../llm';
import { TRANSLATION_JSON_SCHEMA } from '../llm/schemas';

export { CopyStage, CopyStageError, toCopyStageError, withCopyStage } from '../copy/errors';
export type { CopyStage as CopyStageType } from '../copy/errors';

export interface TranslationTextItem {
  header: string;
  content: string;
}

export interface TranslationOptions {
  provider: LLMProvider;
  protocol: LLMProtocol;
  baseUrl: string;
  apiKey: string;
  model: string;
  systemMessage: string;
  jsonSystemMessage: string;
  suffix?: string;
  customVariables: { name: string; value: string }[];
  batchTranslation: boolean;
  enableJsonSchema: boolean;
}

async function requestChatCompletion(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  options: TranslationOptions,
  parameters: Record<string, unknown> = {},
) {
  const { response_format, jsonSchema, ...providerParameters } = parameters;
  const response = await requestLLM(
    {
      id: 'active',
      name: 'active',
      ...options,
    },
    {
      model: options.model,
      messages,
      jsonMode: response_format !== undefined,
      jsonSchema: jsonSchema as Record<string, unknown> | undefined,
      parameters: providerParameters,
    },
  );
  return { choices: [{ message: { content: response.text } }] };
}

function cleanMarkdownJson(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('模型未返回有效文本内容');
  }
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }
  return cleaned;
}

function getResponseContent(data: any): string {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('模型未返回有效译文');
  }
  return content;
}

function parseTranslationList(raw: unknown, expectedLength: number): string[] {
  const parsed: unknown = JSON.parse(cleanMarkdownJson(raw));
  const list = Array.isArray(parsed)
    ? parsed
    : (parsed as { translations?: unknown })?.translations;
  if (
    !Array.isArray(list) ||
    list.length !== expectedLength ||
    list.some((item) => typeof item !== 'string')
  ) {
    throw new Error('返回格式或元素数量不匹配');
  }
  return list;
}

async function translateWithConcurrency(
  contents: string[],
  options: TranslationOptions,
  concurrency = 4,
): Promise<string[]> {
  const translated = [...contents];
  for (let index = 0; index < contents.length; index += concurrency) {
    const chunk = contents.slice(index, index + concurrency);
    const chunkResult = await Promise.all(
      chunk.map((text) =>
        text.trim() ? getOpenAITranslation(text, options) : Promise.resolve(text),
      ),
    );
    translated.splice(index, chunkResult.length, ...chunkResult);
  }
  return translated;
}

/** Translate a list while preserving its order and empty entries. */
export async function translateTextContents(
  contents: string[],
  options: TranslationOptions,
): Promise<string[]> {
  if (contents.length === 0) return [];

  const isBatch = options.batchTranslation && contents.length > 1;
  if (!isBatch) return translateWithConcurrency(contents, options);

  if (options.enableJsonSchema) {
    const data = await requestChatCompletion(
      [
        { role: 'system', content: options.systemMessage },
        { role: 'system', content: BATCH_TRANSLATION_SYSTEM_MESSAGE },
        { role: 'user', content: JSON.stringify(contents) },
      ],
      options,
      { response_format: { type: 'json_object' }, jsonSchema: TRANSLATION_JSON_SCHEMA },
    );
    try {
      return parseTranslationList(getResponseContent(data), contents.length);
    } catch (err) {
      throw new Error(
        `LLM 结构化输出解析失败: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const data = await requestChatCompletion(
    [
      { role: 'system', content: options.systemMessage },
      { role: 'system', content: options.jsonSystemMessage },
      { role: 'user', content: JSON.stringify(contents) },
    ],
    options,
  );
  try {
    return parseTranslationList(getResponseContent(data), contents.length);
  } catch (err) {
    throw new Error(`LLM 返回 JSON 格式错误: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function getOpenAITranslation(
  text: string,
  options: TranslationOptions,
): Promise<string> {
  if (!text || !text.trim()) return text;
  const data = await requestChatCompletion(
    [
      { role: 'system', content: options.systemMessage },
      { role: 'user', content: text },
    ],
    options,
  );
  return getResponseContent(data);
}

export async function translateTextItems(
  items: TranslationTextItem[],
  options: TranslationOptions,
  separator: string,
  suffix = '',
): Promise<string> {
  if (items.length === 0) return '';
  const contents = await translateTextContents(
    items.map((item) => item.content),
    options,
  );

  const resultText = items
    .map((item, index) => `${item.header}${contents[index] ? '\n' : ''}${contents[index]}`)
    .join(separator);
  if (suffix.trim()) {
    return `${resultText}\n${suffix.trim()}`;
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

export function sendChromeMessage<T = any>(
  type: string,
  data: Record<string, unknown>,
): Promise<T> {
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
  const pad = (num: number) => String(num).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  // return date.toLocaleString().split('/').join('-').split(':').join('');
}

export async function getBase64Image(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'fetchImageAsBase64', url }, (response) => {
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
    chrome.runtime.sendMessage({ type: 'downloadImageList', data }, (response) => {
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
    if (data.url.startsWith('data:')) {
      return { displaySrc: data.url, originalSrc: localPath };
    }
    try {
      const base64 = await getBase64Image(data.url);
      return { displaySrc: base64, originalSrc: localPath };
    } catch {
      return { displaySrc: localPath, originalSrc: localPath };
    }
  }
  if (data.url.startsWith('data:')) {
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

export interface CopyContentImage {
  result?: ProcessImageResult;
  alt: string;
}

export interface CopyContentArticle {
  userName: string;
  time: string;
  textContent: string;
  imageDataList: CopyContentImage[];
}

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] || character,
  );
}

/** Compose article text, an optional screenshot, and processed images for clipboard output. */
export function composeCopyContent(
  articleDataList: CopyContentArticle[],
  screenshot: string,
  suffix: string,
  altPrefix = 'ALT: ',
): string {
  const text = articleDataList
    .map(({ userName, time, textContent }) => {
      const header = `${userName} · ${new Date(time).toLocaleString()}`;
      return `${header}${textContent ? '\n' : ''}${textContent}`;
    })
    .join('\n---------------\n');
  const textWithSuffix = text && suffix.trim() ? `${text}\n${suffix.trim()}` : text;
  const imageBlocks = articleDataList.flatMap(({ imageDataList }) =>
    imageDataList.flatMap(({ result, alt }) => {
      if (!result) return [];
      const imageHtml = formatImageHtml(result);
      const trimmedAlt = alt.trim();
      return trimmedAlt ? `${imageHtml}\n${altPrefix}${escapeHtml(trimmedAlt)}` : imageHtml;
    }),
  );

  return [textWithSuffix, screenshot, ...imageBlocks].filter(Boolean).join('\n');
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
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
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
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(downloadUrl);
        resolve();
      } else {
        reject(new Error(`下载失败: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('网络错误'));
    xhr.send();
  });
}
