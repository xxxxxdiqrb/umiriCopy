import { appState, showToast } from "../../../shared/store";
import { observer } from "../platform";

export async function handleDownloadVideo(): Promise<void> {
  // TODO: 实现 TikTok 视频下载功能
  const selectedArticles = observer.getSelectedArticleElements();
  if (selectedArticles.length !== 1) return;
  
  appState.loading.visible = true;
  appState.loading.text = "正在下载视频...";
  
  try {
    // TODO: 获取视频 URL 并下载
    showToast("下载视频成功", "success");
  } catch (error) {
    appState.actionBar.visible = true;
    appState.actionBar.message = error instanceof Error ? error.message : "下载失败";
    appState.actionBar.buttonText = "确定";
    appState.actionBar.handler = null;
  } finally {
    appState.loading.visible = false;
  }
}

export async function setVideoSize(articleList: HTMLElement[]): Promise<{ removeOverlay: () => Promise<void> }> {
  // TODO: 实现视频尺寸设置
  return {
    removeOverlay: async () => {
      // TODO: 移除覆盖层
    }
  };
}
