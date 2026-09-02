import { formatImageHtml, processImage, toCopyStageError, type ProcessImageResult } from '../utils';
import { CopyStage } from './errors';
import type { ArticleImageData } from './types';

export async function processArticleImages(images: ArticleImageData[], download: boolean, reportProgress: (progress: { current: number; total: number }) => void): Promise<ProcessImageResult[]> {
  const results: ProcessImageResult[] = [];
  for (let index = 0; index < images.length; index++) {
    reportProgress({ current: index + 1, total: images.length });
    try { results[index] = await processImage({ name: images[index].imageName, url: images[index].url }, download); }
    catch (error) { throw toCopyStageError(CopyStage.Image, '图片获取失败', error); }
  }
  return results;
}

export async function processScreenshot(base64: string, name: string, download: boolean): Promise<string> {
  if (!base64) return '';
  try { return formatImageHtml(await processImage({ name, url: base64 }, download)); }
  catch (error) { throw toCopyStageError(CopyStage.Screenshot, '截图获取失败', error); }
}
