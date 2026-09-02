import {
  formatImageHtml,
  processImage,
  toCopyStageError,
  type ProcessImageResult,
} from '../../../shared/utils';
import type { ArticleImageData } from '../../../shared/copy/types';

function getOriginalImageUrl(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set('name', 'orig');
  return parsed.toString();
}

export async function processArticleImages(
  images: ArticleImageData[],
  download: boolean,
  reportProgress: (p: { current: number; total: number }) => void,
): Promise<ProcessImageResult[]> {
  const results: ProcessImageResult[] = [];
  for (let index = 0; index < images.length; index++) {
    reportProgress({ current: index + 1, total: images.length });
    try {
      results[index] = await processImage(
        { name: images[index].imageName, url: getOriginalImageUrl(images[index].url) },
        download,
      );
    } catch (error) {
      throw toCopyStageError('image', '图片获取失败', error);
    }
  }
  return results;
}

export async function processScreenshot(
  base64: string,
  name: string,
  download: boolean,
): Promise<string> {
  if (!base64) return '';
  try {
    return formatImageHtml(await processImage({ name, url: base64 }, download));
  } catch (error) {
    throw toCopyStageError('screenshot', '截图获取失败', error);
  }
}
