export interface ConfigItem {
  key: string
  label: string
  type: 'toggle' | 'select'
  value: boolean | string
  options?: { label: string; value: string }[]
  dependsOn?: string
}

export interface PlatformStore {
  configBar: {
    visible: boolean
    items: ConfigItem[]
    getItem<T = boolean | string>(key: string): T | undefined
  }
}
