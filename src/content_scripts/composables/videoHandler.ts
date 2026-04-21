import { waitATick } from "../../utils";

async function setVideoSize(articleList: HTMLElement[]) {
  const overlays: HTMLDivElement[] = [];

  for (const article of articleList) {
    const videoElementList = Array.from(article.querySelectorAll("video"));
    if (videoElementList.length === 0) continue;

    for (const videoElement of videoElementList) {
      videoElement.pause();
      videoElement.currentTime = 0;

      const posterSrc = videoElement.poster;
      if (!posterSrc) continue;

      const parent = videoElement.parentElement;
      if (!parent) continue;

      const originalPosition = getComputedStyle(parent).position;
      if (originalPosition === "static") {
        parent.style.position = "relative";
      }

      const overlay = document.createElement("div");
      overlay.style.cssText =
        "position:absolute;top:0;left:0;width:100%;height:100%;display:flex;justify-content:center;align-items:center;background-color:black;z-index:1;";

      const img = document.createElement("img");
      img.src = posterSrc;
      img.style.cssText = "object-fit:contain;width:100%;height:100%;";

      overlay.appendChild(img);
      parent.appendChild(overlay);
      overlays.push(overlay);
    }
  }

  await waitATick();

  async function removeOverlay() {
    for (const overlay of overlays) {
      overlay.remove();
    }
    await waitATick();
  }

  return { removeOverlay };
}

export { setVideoSize };
