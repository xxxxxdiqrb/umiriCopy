import { waitIdleCallBack, waitATick, setElementStyle } from "../../utils";

async function setVideoSize(articleList: HTMLElement[]) {
  for (const article of articleList) {
    const videoElementList = Array.from(article.querySelectorAll("video"));
    if (videoElementList.length === 0) continue;

    for (const videoElement of videoElementList) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
  }

  await waitIdleCallBack();

  for (const article of articleList) {
    const videoElementList = Array.from(article.querySelectorAll("video"));
    for (const videoElement of videoElementList) {
      const setAttri =
        videoElement.videoHeight > videoElement.videoWidth ? "width" : "height";
      setElementStyle(videoElement, {
        [setAttri]: "auto",
        position: "",
      });

      setElementStyle(videoElement.parentElement as HTMLElement, {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
      });
    }
  }

  await waitATick();
}

function initCorsVideoTemporaryStorage(articleList: HTMLElement[]) {
  let videoList: HTMLVideoElement[] = [];
  for (const article of articleList) {
    videoList = videoList.concat(Array.from(article.querySelectorAll("video")));
  }
  videoList = videoList.filter((video) => !!video.src);

  const temporaryStorage: {
    parent: HTMLElement;
    video: HTMLVideoElement;
    cover: HTMLImageElement;
  }[] = [];

  async function hideVideo() {
    for (const video of videoList) {
      const cover = document.createElement("img");
      cover.src = video.poster;
      cover.style.cssText = "object-fit: contain; width: 100%; height: 100%;";

      temporaryStorage.push({
        parent: video.parentElement as HTMLElement,
        video: video,
        cover: cover,
      });

      video.parentElement!.appendChild(cover);
      video.remove();
    }
    await waitATick();
  }

  async function showVideo() {
    for (const item of temporaryStorage) {
      item.cover.remove();
      item.parent.appendChild(item.video);
    }
    await waitATick();
  }

  return { hideVideo, showVideo };
}

export { setVideoSize, initCorsVideoTemporaryStorage };
