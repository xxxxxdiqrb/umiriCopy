import type { ProcessImageResult, TranslationOptions } from '../utils';

export interface ArticleImageData {
  url: string;
  alt: string;
  imageName: string;
}

export interface ArticleData {
  userName: string;
  userScreenName?: string;
  time: string;
  textContent: string;
  imageDataList: ArticleImageData[];
}

export interface ProcessedArticleImageData extends ArticleImageData {
  result?: ProcessImageResult;
}

export interface ProcessedArticleData extends Omit<ArticleData, 'imageDataList'> {
  imageDataList: ProcessedArticleImageData[];
}

export interface CopyPipelineOptions {
  translate: boolean;
  copyImages: boolean;
  download: boolean;
  suffix: string;
  captureScreenshot?: boolean;
  getAlt?: boolean;
}

export interface PlatformCapabilities {
  screenshot?: boolean;
  imageAlt?: boolean;
  video?: boolean;
}

export interface PlatformAdapter {
  platform: string;
  capabilities: PlatformCapabilities;
  collectArticlesData(
    articles: HTMLElement[],
    options: CopyPipelineOptions,
  ): Promise<ArticleData[]>;
  processArticleImages?: (
    images: ArticleImageData[],
    download: boolean,
    reportProgress: (progress: { current: number; total: number }) => void,
  ) => Promise<ProcessImageResult[]>;
  captureScreenshot?: (articles: HTMLElement[]) => Promise<string>;
  processScreenshot?: (base64: string, name: string, download: boolean) => Promise<string>;
}

export type { TranslationOptions };
