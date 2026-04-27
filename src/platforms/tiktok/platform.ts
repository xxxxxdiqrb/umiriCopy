import { reactive, computed } from "vue";
import { createArticleSelectorObserver } from "../../shared/composables/createArticleSelectorObserver";

export interface TiktokPlatformState {
  configBar: {
    visible: boolean;
  };
}

export const platformState: TiktokPlatformState = reactive({
  configBar: {
    visible: false,
  },
});

export const configItems = computed(() => []);

export const updateConfig = (key: string, value: boolean | string) => {
  if (key === "visible") {
    platformState.configBar.visible = value as boolean;
  }
};

export const observer = createArticleSelectorObserver({
  prefix: "tiktok-copy",
  articleIdPrefix: "tiktok-article",
  articleSelector: "",
  singleSelect: true,
  getObserverTarget: () => null,
});
