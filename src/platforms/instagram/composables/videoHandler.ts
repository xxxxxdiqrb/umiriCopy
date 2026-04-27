import { downloadVideoWithProgress } from "../../../shared/utils";
import { observer, platformState } from "../platform";
import { getMediaInfo } from "./instagramService";
import {
  exitCopyState,
  showDownloadError,
  createProgressCallback,
  showDownloadSuccess,
  showLoadingWithText,
} from "../../../shared/composables/useVideoDownload";

function formatInstagramDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day}`;
}

export async function handleDownloadVideo(): Promise<void> {
  try {
    const selectedArticles = observer.getSelectedArticleElements();
    if (selectedArticles.length !== 1) return;
    const article = selectedArticles[0];

    showLoadingWithText("正在获取帖子信息...");

    const detail = await getMediaInfo(article);
    if (!detail) {
      throw new Error("获取帖子信息失败");
    }

    if (!detail.media.videoUrl) {
      throw new Error("该帖子没有视频");
    }

    const username = detail.user.username;
    const postDate = formatInstagramDate(detail.createdAt);
    const code = detail.code;
    const filename = `${username}_${postDate}_${code}.mp4`;

    showLoadingWithText("正在下载视频...");
    await downloadVideoWithProgress(
      detail.media.videoUrl,
      filename,
      createProgressCallback("正在下载视频")
    );

    showDownloadSuccess();
    exitCopyState(platformState, observer);
  } catch (error) {
    showDownloadError(error);
  }
}
