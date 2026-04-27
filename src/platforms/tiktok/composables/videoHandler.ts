import { downloadVideoWithProgress } from "../../../shared/utils";
import { showDownloadError, createProgressCallback, showDownloadSuccess, showLoadingWithText } from "../../../shared/composables/useVideoDownload";

interface TikTokVideoInfo {
  videoUrl: string;
  username: string;
  nickname: string;
  createTime: number;
  videoId: string;
}

function formatTikTokDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day}`;
}

async function getTikTokVideoInfo(url: string): Promise<TikTokVideoInfo> {
  const response = await fetch(url);
  const html = await response.text();

  const match = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">(.+?)<\/script>/);
  if (!match) throw new Error("未找到视频数据");

  const data = JSON.parse(match[1]);
  const itemStruct = data.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct;

  if (!itemStruct) throw new Error("视频数据解析失败");

  const video = itemStruct.video;
  const videoUrl = video?.playAddr || video?.downloadAddr;
  if (!videoUrl) throw new Error("未找到视频链接");

  return {
    videoUrl,
    username: itemStruct.author?.uniqueId || "unknown",
    nickname: itemStruct.author?.nickname || "",
    createTime: itemStruct.createTime || Math.floor(Date.now() / 1000),
    videoId: itemStruct.id || String(Date.now()),
  };
}

export async function handleDownloadVideo(): Promise<void> {
  try {
    showLoadingWithText("正在获取视频信息...");

    const info = await getTikTokVideoInfo(window.location.href);
    const postDate = formatTikTokDate(info.createTime);
    const filename = `${info.username}_${postDate}_${info.videoId}.mp4`;

    await downloadVideoWithProgress(info.videoUrl, filename, createProgressCallback("正在下载视频"), { withCredentials: true });

    showDownloadSuccess();
  } catch (error) {
    showDownloadError(error);
  }
}
