import { reactive } from 'vue'

export interface AppState {
  loading: {
    visible: boolean
    text: string
  }
  actionBar: {
    visible: boolean
    message: string
    buttonText: string
    handler: (() => void) | null
  }
  configBar: {
    visible: boolean
    translate: boolean
    copyImages: boolean
    download: boolean
  }
  previewDialog: {
    visible: boolean
    content: string
  }
  selectMode: {
    active: boolean
  }
  selectedArticles: Set<string>
  options: {
    apiKey: string
    model: string
    baseUrl: string
    systemMessage: string
    otherParam: Record<string, unknown>
  }
  toast: {
    visible: boolean
    message: string
    type: 'success' | 'error'
  }
}

export const appState = reactive<AppState>({
  loading: { visible: false, text: '正在复制' },
  actionBar: { visible: false, message: '', buttonText: '确定', handler: null },
  configBar: { visible: false, translate: true, copyImages: false, download: false },
  previewDialog: { visible: false, content: '' },
  selectMode: { active: false },
  selectedArticles: new Set(),
  options: { apiKey: '', model: '', baseUrl: '', systemMessage: '', otherParam: {} },
  toast: { visible: false, message: '', type: 'success' }
})

export function showToast(message: string, type: 'success' | 'error' = 'success') {
  appState.toast.message = message
  appState.toast.type = type
  appState.toast.visible = true
}
