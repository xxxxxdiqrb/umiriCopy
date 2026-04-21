import { reactive } from "vue";
import type { ProviderConfig } from "../options/types";

export interface AppState {
  loading: {
    visible: boolean;
    text: string;
  };
  actionBar: {
    visible: boolean;
    message: string;
    buttonText: string;
    handler: (() => void) | null;
  };
  configBar: {
    visible: boolean;
    translate: boolean;
    copyImages: boolean;
    download: boolean;
    selectedProviderId: string | null;
  };
  previewDialog: {
    visible: boolean;
    content: string;
  };
  selectMode: {
    active: boolean;
  };
  selectedArticles: Set<string>;
  options: {
    apiKey: string;
    model: string;
    baseUrl: string;
    systemMessage: string;
    otherParam: Record<string, unknown>;
  };
  providers: ProviderConfig[];
  defaultProviderId: string | null;
  toast: {
    visible: boolean;
    message: string;
    type: "success" | "error";
  };
}

export const appState = reactive<AppState>({
  loading: { visible: false, text: "正在复制" },
  actionBar: { visible: false, message: "", buttonText: "确定", handler: null },
  configBar: {
    visible: false,
    translate: true,
    copyImages: true,
    download: false,
    selectedProviderId: null,
  },
  previewDialog: { visible: false, content: "" },
  selectMode: { active: false },
  selectedArticles: new Set(),
  options: {
    apiKey: "",
    model: "",
    baseUrl: "",
    systemMessage: "",
    otherParam: {},
  },
  providers: [],
  defaultProviderId: null,
  toast: { visible: false, message: "", type: "success" },
});

export function applyProvider(provider: ProviderConfig) {
  const { apiKey, model, baseUrl, systemMessage, customVariables } = provider;
  const customVars: Record<string, unknown> = {};
  if (customVariables && Array.isArray(customVariables)) {
    for (const v of customVariables) {
      if (v.name && v.name.trim()) {
        let val: string | number | boolean = v.value;
        if (v.value === "true") val = true;
        else if (v.value === "false") val = false;
        else {
          const num = Number(v.value);
          if (v.value !== "" && !isNaN(num)) val = num;
        }
        customVars[v.name.trim()] = val;
      }
    }
  }
  Object.assign(appState.options, {
    apiKey,
    model,
    baseUrl,
    systemMessage,
    otherParam: { ...customVars },
  });
}

export function showToast(
  message: string,
  type: "success" | "error" = "success",
) {
  appState.toast.message = message;
  appState.toast.type = type;
  appState.toast.visible = true;
}

export async function refreshProvidersFromStorage() {
  const stored = (await chrome.storage.local.get("options")).options;
  if (stored?.providers) {
    let providers: ProviderConfig[] = [];
    if (Array.isArray(stored.providers)) {
      providers = stored.providers;
    } else if (typeof stored.providers === "object") {
      providers = Object.values(stored.providers);
    }

    appState.providers = providers;

    if (providers.length > 0) {
      const defaultId = stored.defaultProviderId;
      appState.defaultProviderId = defaultId;
      appState.configBar.selectedProviderId = defaultId;

      const provider =
        providers.find((p) => p.id === defaultId) || providers[0];
      if (provider) {
        applyProvider(provider);
      }
    } else {
      appState.defaultProviderId = null;
      appState.configBar.selectedProviderId = null;
    }
  } else {
    appState.providers = [];
    appState.defaultProviderId = null;
    appState.configBar.selectedProviderId = null;
  }
}
