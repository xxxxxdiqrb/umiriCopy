import { appState, showToast, showActionBar, closeActionBar } from '../store';
import type { PlatformState } from './createPlatformStore';
import { CopyStageError } from '../utils';

export type LoadingTextReporter = (text: string) => void;

export interface UsePlatformCopyOptions {
  platformState: PlatformState;
  updateConfig: (key: string, value: boolean | string) => void;
  getSelectedArticleElements: () => HTMLElement[];
  unmountAllSelectors: () => Promise<void>;
  copyArticles: (
    articles: HTMLElement[],
    reportLoadingText: LoadingTextReporter,
  ) => Promise<string>;
  validateBeforeSubmit?: () => string | null;
}

function getErrorMessage(error: unknown): string {
  const errorStr = String(error);

  const errorMap: Record<string, string> = {
    '401': 'API Key 无效或已过期，请检查翻译配置',
    '403': 'API 访问被拒绝，请检查 API Key 权限',
    '404': 'API 地址不存在，请检查 Base URL',
    '429': 'API 请求过于频繁，请稍后重试',
    '500': 'API 服务暂时不可用',
    '502': 'API 服务网关错误',
    '503': 'API 服务暂不可用',
  };

  for (const [code, msg] of Object.entries(errorMap)) {
    if (errorStr.includes(code)) return msg;
  }

  if (errorStr.includes('fetch') || errorStr.includes('network') || errorStr.includes('Network')) {
    return '网络连接失败，请检查网络连接';
  }

  return errorStr;
}

export function usePlatformCopy(options: UsePlatformCopyOptions) {
  const {
    platformState,
    updateConfig,
    getSelectedArticleElements,
    unmountAllSelectors,
    copyArticles,
    validateBeforeSubmit,
  } = options;

  let retryArticles: HTMLElement[] | null = null;

  const handleCancel = () => {
    retryArticles = null;
    closeActionBar();
    platformState.configBar.visible = false;
    appState.selectMode.active = false;
    appState.selectedArticles.clear();
    unmountAllSelectors();
  };

  const executeCopy = async (articles: HTMLElement[]) => {
    appState.loading.visible = true;
    appState.loading.text = '正在复制';

    try {
      const copyString = await copyArticles(articles, (text) => {
        appState.loading.text = text;
      });
      appState.previewDialog.content = copyString;
      appState.previewDialog.visible = true;
      retryArticles = null;
      closeActionBar();
    } catch (e) {
      console.error(e);
      const stageName =
        e instanceof CopyStageError
          ? {
              alt: 'ALT文本获取',
              translation: '翻译',
              screenshot: '截图',
              image: '图片下载',
              text: '文本获取',
              resource: '资源获取',
            }[e.stage]
          : '资源获取';
      retryArticles = articles;
      showActionBar({
        message: `${stageName}失败：${getErrorMessage(e)}`,
        actions: [
          {
            label: '取消',
            type: 'secondary',
            handler: () => {
              retryArticles = null;
            },
          },
          {
            label: '重试',
            type: 'primary',
            handler: () => {
              if (retryArticles) void executeCopy(retryArticles);
            },
          },
        ],
      });
    } finally {
      appState.loading.visible = false;
      platformState.configBar.visible = false;
      appState.selectMode.active = false;
      appState.selectedArticles.clear();
      unmountAllSelectors();
    }
  };

  const handleSubmit = async () => {
    const articles = getSelectedArticleElements();
    if (articles.length === 0) {
      handleCancel();
      return;
    }

    const validationError = validateBeforeSubmit?.();
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    await executeCopy(articles);
  };

  const handleUpdateItem = (key: string, value: boolean | string) => {
    updateConfig(key, value);
  };

  return { handleCancel, handleSubmit, handleUpdateItem };
}
