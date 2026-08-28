import { appState, showToast, showActionBar } from '../store';
import type { PlatformState } from './createPlatformStore';
import type { createArticleSelectorObserver } from './createArticleSelectorObserver';

type ArticleSelectorObserver = ReturnType<typeof createArticleSelectorObserver>;

export type VideoDownloadProgressCallback = (percent: number) => void;

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
