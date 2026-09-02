import { appState, showToast, showActionBar } from '../store';
import type { PlatformState } from './createPlatformStore';
import type { createArticleSelectorObserver } from './createArticleSelectorObserver';
import { downloadVideoWithProgress, type DownloadVideoOptions } from '../utils';

type ArticleSelectorObserver = ReturnType<typeof createArticleSelectorObserver>;

export type VideoDownloadProgressCallback = (percent: number) => void;

export interface VideoDownloadResource {
  fileName: string;
  url: string;
  options?: DownloadVideoOptions;
}

export interface ExecuteVideoDownloadOptions {
  collectVideos: () => Promise<VideoDownloadResource[]>;
  collectingText?: string;
  emptyMessage?: string;
  onSuccess?: () => void;
}

export async function executeVideoDownload({
  collectVideos,
  collectingText = '正在获取视频信息...',
  emptyMessage = '没有找到可下载的视频',
  onSuccess,
}: ExecuteVideoDownloadOptions): Promise<void> {
  try {
    showLoadingWithText(collectingText);
    const videos = await collectVideos();
    if (videos.length === 0) throw new Error(emptyMessage);

    for (let index = 0; index < videos.length; index++) {
      const video = videos[index];
      const progressText = `正在下载视频 ${index + 1}/${videos.length}`;
      showLoadingWithText(progressText);
      await downloadVideoWithProgress(
        video.url,
        video.fileName,
        createProgressCallback(progressText),
        video.options,
      );
    }

    showDownloadSuccess();
    onSuccess?.();
  } catch (error) {
    showDownloadError(error);
  }
}

export function exitCopyState(
  platformState: PlatformState,
  observer: ArticleSelectorObserver,
): void {
  platformState.configBar.visible = false;
  appState.selectMode.active = false;
  appState.selectedArticles.clear();
  observer.unmountAllSelectors();
}

export function showDownloadError(error: unknown): void {
  appState.loading.visible = false;
  showActionBar({
    message: error instanceof Error ? error.message : '下载失败',
    buttonText: '确定',
  });
}

export function createProgressCallback(prefix: string): VideoDownloadProgressCallback {
  return (percent: number) => {
    appState.loading.text = `${prefix}\n当前进度 ${percent.toFixed(2)}%`;
  };
}

export function showDownloadSuccess(): void {
  appState.loading.visible = false;
  showToast('下载视频成功', 'success');
}

export function showLoadingWithText(text: string): void {
  appState.loading.visible = true;
  appState.loading.text = text;
}
