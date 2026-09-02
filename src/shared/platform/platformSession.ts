import { appState } from '../store';
import type { PlatformState } from '../composables/createPlatformStore';
import type { PlatformObserver } from './types';

export function exitPlatformSession(state: PlatformState, observer: PlatformObserver): void {
  state.configBar.visible = false;
  appState.selectMode.active = false;
  appState.selectedArticles.clear();
  void observer.unmountAllSelectors();
}
