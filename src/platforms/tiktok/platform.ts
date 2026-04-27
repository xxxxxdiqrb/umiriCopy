import { reactive } from "vue";

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
