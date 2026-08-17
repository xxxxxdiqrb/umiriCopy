import { reactive } from "vue";
import { normalizeProviderConfig, type ProviderConfig } from "../options/types";
import { JSON_SYSTEM_MESSAGE } from "./constants";

export interface ActionBarAction {
  label: string;
  type?: "primary" | "secondary";
  handler?: (() => void) | null;
}

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
    retryVisible: boolean;
    retryHandler: (() => void) | null;
    actions?: ActionBarAction[];
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
    suffix: string;
    jsonSystemMessage: string;
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
  actionBar: {
    visible: false,
    message: "",
    buttonText: "确定",
    handler: null,
    retryVisible: false,
    retryHandler: null,
    actions: undefined,
  },
  previewDialog: { visible: false, content: "" },
  selectMode: { active: false },
  selectedArticles: new Set(),
  options: {
    apiKey: "",
    model: "",
    baseUrl: "",
    systemMessage: "",
    suffix: "",
    jsonSystemMessage: JSON_SYSTEM_MESSAGE,
    otherParam: {},
  },
  providers: [],
  defaultProviderId: null,
  toast: { visible: false, message: "", type: "success" },
});

export function applyProvider(provider: ProviderConfig) {
  const { apiKey, model, baseUrl, systemMessage, suffix, customVariables } = provider;
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
    suffix: suffix ?? "",
    jsonSystemMessage: JSON_SYSTEM_MESSAGE,
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

export interface ShowActionBarOptions {
  message: string;
  actions?: ActionBarAction[];
  buttonText?: string;
  handler?: (() => void) | null;
  retryVisible?: boolean;
  retryHandler?: (() => void) | null;
}

export function showActionBar(options: ShowActionBarOptions) {
  appState.actionBar.message = options.message;
  appState.actionBar.actions = options.actions;
  appState.actionBar.buttonText = options.buttonText ?? "确定";
  appState.actionBar.handler = options.handler ?? null;
  appState.actionBar.retryVisible = options.retryVisible ?? false;
  appState.actionBar.retryHandler = options.retryHandler ?? null;
  appState.actionBar.visible = true;
}

export function closeActionBar() {
  appState.actionBar.visible = false;
  appState.actionBar.message = "";
  appState.actionBar.actions = undefined;
  appState.actionBar.buttonText = "确定";
  appState.actionBar.handler = null;
  appState.actionBar.retryVisible = false;
  appState.actionBar.retryHandler = null;
}

export async function refreshProvidersFromStorage() {
  const stored = (await chrome.storage.local.get("options")).options;
  if (stored?.providers) {
    let providers: ProviderConfig[] = [];
    if (Array.isArray(stored.providers)) {
      providers = stored.providers.map((provider: Partial<ProviderConfig>) => normalizeProviderConfig(provider));
    } else if (typeof stored.providers === "object") {
      providers = Object.values(stored.providers).map((provider) => normalizeProviderConfig(provider as Partial<ProviderConfig>));
    }

    appState.providers = providers;

    if (providers.length > 0) {
      const defaultId = stored.defaultProviderId;
      appState.defaultProviderId = defaultId;

      const provider =
        providers.find((p) => p.id === defaultId) || providers[0];
      if (provider) {
        applyProvider(provider);
      }
    } else {
      appState.defaultProviderId = null;
    }
  } else {
    appState.providers = [];
    appState.defaultProviderId = null;
  }
}