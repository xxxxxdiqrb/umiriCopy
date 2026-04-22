import { appState, showToast } from "../store";
import type { PlatformState } from "./createPlatformStore";

export interface UsePlatformCopyOptions {
    platformState: PlatformState;
    updateConfig: (key: string, value: boolean | string) => void;
    getSelectedArticleElements: () => HTMLElement[];
    unmountAllSelectors: () => Promise<void>;
    copyArticles: (articles: HTMLElement[]) => Promise<string>;
    validateBeforeSubmit?: () => string | null;
}

function getErrorMessage(error: unknown): string {
    const errorStr = String(error);

    const errorMap: Record<string, string> = {
        "401": "API Key 无效或已过期，请检查翻译配置",
        "403": "API 访问被拒绝，请检查 API Key 权限",
        "404": "API 地址不存在，请检查 Base URL",
        "429": "API 请求过于频繁，请稍后重试",
        "500": "API 服务暂时不可用",
        "502": "API 服务网关错误",
        "503": "API 服务暂不可用",
    };

    for (const [code, msg] of Object.entries(errorMap)) {
        if (errorStr.includes(code)) return msg;
    }

    if (
        errorStr.includes("fetch") ||
        errorStr.includes("network") ||
        errorStr.includes("Network")
    ) {
        return "网络连接失败，请检查网络连接";
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

    const handleCancel = () => {
        platformState.configBar.visible = false;
        appState.selectMode.active = false;
        appState.selectedArticles.clear();
        unmountAllSelectors();
    };

    const handleSubmit = async () => {
        const articles = getSelectedArticleElements();
        if (articles.length === 0) {
            handleCancel();
            return;
        }

        const validationError = validateBeforeSubmit?.();
        if (validationError) {
            showToast(validationError, "error");
            return;
        }

        appState.loading.visible = true;
        appState.loading.text = "正在复制";

        try {
            const copyString = await copyArticles(articles);
            appState.previewDialog.content = copyString;
            appState.previewDialog.visible = true;
        } catch (e) {
            console.error(e);
            const stage = appState.loading.text;
            const stageName = stage.includes("翻译")
                ? "翻译"
                : stage.includes("截图")
                    ? "截图"
                    : stage.includes("图片")
                        ? "图片下载"
                        : "资源获取";
            appState.actionBar.message = `${stageName}失败：${getErrorMessage(e)}`;
            appState.actionBar.buttonText = "确定";
            appState.actionBar.handler = null;
            appState.actionBar.visible = true;
        } finally {
            appState.loading.visible = false;
            platformState.configBar.visible = false;
            appState.selectMode.active = false;
            appState.selectedArticles.clear();
            unmountAllSelectors();
        }
    };

    const handleUpdateItem = (key: string, value: boolean | string) => {
        updateConfig(key, value);
    };

    return { handleCancel, handleSubmit, handleUpdateItem };
}
