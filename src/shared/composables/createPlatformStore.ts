import { reactive, computed } from "vue";
import { appState, applyProvider } from "../store";
import type { ConfigItem } from "../types";

export interface PlatformState {
  configBar: {
    visible: boolean;
    translate: boolean;
    copyImages: boolean;
    download: boolean;
    selectedProviderId: string | null;
  };
}

export function createPlatformStore() {
    const platformState = reactive<PlatformState>({
        configBar: {
            visible: false,
            translate: true,
            copyImages: true,
            download: false,
            selectedProviderId: null,
        },
    });

    const configItems = computed<ConfigItem[]>(() => [
        {
            key: "translate",
            label: "是否翻译",
            type: "toggle",
            value: platformState.configBar.translate,
        },
        {
            key: "selectedProviderId",
            label: "翻译服务",
            type: "select",
            value: platformState.configBar.selectedProviderId || "",
            dependsOn: "translate",
            options: appState.providers.map((p) => ({
                label: p.name,
                value: p.id,
            })),
        },
        {
            key: "copyImages",
            label: "复制图片",
            type: "toggle",
            value: platformState.configBar.copyImages,
        },
        {
            key: "download",
            label: "图片下载到本地",
            type: "toggle",
            value: platformState.configBar.download,
            dependsOn: "copyImages",
        },
    ]);

    function updateConfig(key: string, value: boolean | string) {
        const configBar = platformState.configBar;
        switch (key) {
            case "visible":
                configBar.visible = value as boolean;
                break;
            case "translate":
                configBar.translate = value as boolean;
                break;
            case "copyImages":
                configBar.copyImages = value as boolean;
                if (!value) {
                    configBar.download = false;
                }
                break;
            case "download":
                configBar.download = value as boolean;
                break;
            case "selectedProviderId":
                configBar.selectedProviderId = value as string;
                if (value) {
                    const provider = appState.providers.find((p) => p.id === value);
                    if (provider) {
                        applyProvider(provider);
                    }
                }
                break;
        }
    }

    return { platformState, configItems, updateConfig };
}
