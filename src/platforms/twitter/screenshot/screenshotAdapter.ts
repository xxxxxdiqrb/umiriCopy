import { waitATick } from '../../../shared/utils';
import { captureAndMergeScreenshots } from '../../../shared/copy/screenshot';

async function addVideoPosterOverlays(articles: HTMLElement[]) {
  const overlays: HTMLDivElement[] = [];
  for (const article of articles)
    for (const video of Array.from(article.querySelectorAll('video'))) {
      video.pause();
      video.currentTime = 0;
      if (!video.poster || !video.parentElement) continue;
      const parent = video.parentElement;
      if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
      const overlay = document.createElement('div');
      overlay.style.cssText =
        'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;background-color:black;z-index:1;';
      const image = document.createElement('img');
      image.src = video.poster;
      image.style.cssText = 'object-fit:contain;width:100%;height:100%;';
      overlay.appendChild(image);
      parent.appendChild(overlay);
      overlays.push(overlay);
    }
  await waitATick();
  return async () => {
    overlays.forEach((overlay) => overlay.remove());
    await waitATick();
  };
}

export function captureTwitterScreenshots(articles: HTMLElement[]): Promise<string> {
  return captureAndMergeScreenshots(articles, { before: () => addVideoPosterOverlays(articles) });
}
