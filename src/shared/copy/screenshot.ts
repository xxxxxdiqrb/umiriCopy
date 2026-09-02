import { toPng } from 'html-to-image';

export interface ScreenshotHooks {
  before?: () => Promise<(() => Promise<void>) | void>;
  after?: () => Promise<void>;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('截图数据读取失败'));
    reader.readAsDataURL(blob);
  });
}

async function mergeScreenshots(screenshots: string[]): Promise<string> {
  const bitmaps = await Promise.all(
    screenshots.map(async (src) => createImageBitmap(await (await fetch(src)).blob())),
  );
  try {
    const width = Math.max(...bitmaps.map((image) => image.width));
    const canvas = new OffscreenCanvas(
      width,
      bitmaps.reduce((sum, image) => sum + image.height, 0),
    );
    const context = canvas.getContext('2d');
    if (!context) throw new Error('无法创建截图画布');
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    let y = 0;
    for (const image of bitmaps) {
      context.drawImage(image, (width - image.width) / 2, y);
      y += image.height;
    }
    return blobToDataUrl(await canvas.convertToBlob({ type: 'image/png' }));
  } finally {
    bitmaps.forEach((image) => image.close());
  }
}

export async function captureAndMergeScreenshots(
  articles: HTMLElement[],
  hooks: ScreenshotHooks = {},
): Promise<string> {
  if (articles.length === 0) return '';
  const cleanup = await hooks.before?.();
  try {
    return mergeScreenshots(
      await Promise.all(articles.map((article) => toPng(article, { backgroundColor: 'white' }))),
    );
  } finally {
    await cleanup?.();
    await hooks.after?.();
  }
}
