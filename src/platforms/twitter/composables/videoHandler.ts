import { waitATick } from "../../../shared/utils";
import { downloadVideoWithProgress } from "../../../shared/utils";
import { getTweetDetail, TweetMedia } from "./tweetService";
import { observer, platformState } from "../platform";
import {
  exitCopyState,
  showDownloadError,
  createProgressCallback,
  showDownloadSuccess,
  showLoadingWithText,
} from "../../../shared/composables/useVideoDownload";

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

function extractVideoFilename(url: string): string {
  const urlWithoutQuery = url.split("?")[0];
  const parts = urlWithoutQuery.split("/");
  const filename = parts[parts.length - 1];
  return filename || "video.mp4";
}

function formatTweetDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day}`;
}

function buildFilename(screenName: string, tweetDate: string, videoFilename: string): string {
  return `@${screenName}_${tweetDate}_${videoFilename}`;
}

export async function handleDownloadVideo(): Promise<void> {
  try {
    const selectedArticles = observer.getSelectedArticleElements();
    if (selectedArticles.length !== 1) return;
    const firstArticle = selectedArticles[0];
    const link = firstArticle.querySelector('a[href*="/status/"]') as HTMLAnchorElement;
    const match = link?.href.match(/\/status\/(\d+)/);
    if (!match) return;
    const tweetId = match[1];

    showLoadingWithText("正在获取推文信息...");

    const detail = await getTweetDetail(tweetId);
    if (!detail) {
      throw new Error("获取推文信息失败");
    }

    const videos = detail.media.filter((m: TweetMedia) => m.type === "video" && m.videoUrl);
    if (videos.length === 0) {
      throw new Error("该推文没有视频");
    }

    const total = videos.length;
    const screenName = detail.user.screenName;
    const tweetDate = formatTweetDate(detail.createdAt);

    for (let i = 0; i < total; i++) {
      const video = videos[i];
      if (!video.videoUrl) continue;

      const videoFilename = extractVideoFilename(video.videoUrl);
      const filename = buildFilename(screenName, tweetDate, videoFilename);
      showLoadingWithText(`正在获取视频 ${i + 1}/${total}`);

      await downloadVideoWithProgress(
        video.videoUrl,
        filename,
        createProgressCallback(`正在获取视频 ${i + 1}/${total}`)
      );
    }

    showDownloadSuccess();
    exitCopyState(platformState, observer);
  } catch (error) {
    showDownloadError(error);
  }
}

export { setVideoSize };
