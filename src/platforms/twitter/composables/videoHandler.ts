import { waitATick } from "../../../shared/utils";
import { appState, showToast } from "../../../shared/store";
import { downloadVideoWithProgress } from "../../../shared/utils";
import { getTweetDetail, TweetMedia } from "./tweetService";
import { observer } from "../platform";

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

    appState.loading.visible = true;
    appState.loading.text = "正在获取推文信息...";

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
      appState.loading.text = `正在获取视频 ${i + 1}/${total}\n当前进度 0.00%`;

      await downloadVideoWithProgress(video.videoUrl, filename, (percent: number) => {
        appState.loading.text = `正在获取视频 ${i + 1}/${total}\n当前进度 ${percent.toFixed(2)}%`;
      });
    }

    appState.loading.visible = false;
    showToast("下载视频成功", "success");
  } catch (error) {
    appState.loading.visible = false;
    appState.actionBar.visible = true;
    appState.actionBar.message = error instanceof Error ? error.message : "下载失败";
    appState.actionBar.buttonText = "确定";
    appState.actionBar.handler = null;
  }
}

export { setVideoSize };
