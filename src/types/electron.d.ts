export interface WordPressSite {
  id: string
  name: string
  url: string
  apiKey: string
  apiSecret: string
  status: 'online' | 'offline' | 'pending' | 'error' | 'no-plugin'
  lastSync?: string
  createdAt: string
  wpVersion?: string
  phpVersion?: string
  pluginCount?: number
  themeCount?: number
  activeTheme?: string
}

export interface SiteStatusResult {
  status: 'online' | 'offline' | 'error' | 'no-plugin'
  data: any
}

export interface AppSettings {
  darkMode: boolean
  autoSync: boolean
  syncInterval: string
  notifications: boolean
  updateAlerts: boolean
  siteDownAlerts: boolean
}

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  data?: {
    version?: string
    releaseDate?: string
    releaseNotes?: string | null
    percent?: number
    bytesPerSecond?: number
    transferred?: number
    total?: number
    message?: string
  }
}

export interface UpdaterStatus {
  updateAvailable: boolean
  updateDownloaded: boolean
  downloadProgress: number
  currentVersion: string
  updateVersion: string | null
  releaseNotes: string | null
}

declare global {
  interface Window {
    electronAPI: {
      getSites: () => Promise<WordPressSite[]>
      addSite: (
        site: Omit<WordPressSite, 'id' | 'createdAt' | 'status'>
      ) => Promise<WordPressSite>
      updateSite: (
        id: string,
        updates: Partial<WordPressSite>
      ) => Promise<WordPressSite | null>
      deleteSite: (id: string) => Promise<boolean>
      checkSiteStatus: (params: {
        url: string
        apiKey: string
        apiSecret: string
      }) => Promise<SiteStatusResult>
      fetchFromSite: (params: {
        url: string
        method?: string
        apiKey: string
        apiSecret: string
        body?: any
      }) => Promise<{ ok: boolean; status: number; data: any }>
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      isMaximized: () => Promise<boolean>
      getSettings: () => Promise<AppSettings>
      saveSettings: (settings: AppSettings) => Promise<AppSettings>
      getSetting: (key: string) => Promise<any>
      saveSetting: (key: string, value: any) => Promise<AppSettings>
      // Auto-updater
      updaterCheck: () => Promise<{
        status: string
        updateAvailable?: boolean
        version?: string
        message?: string
      }>
      updaterDownload: () => Promise<{ status: string; message?: string }>
      updaterInstall: () => Promise<{ status: string; message?: string }>
      updaterGetStatus: () => Promise<UpdaterStatus>
      getAppVersion: () => Promise<string>
      onUpdateStatus: (callback: (status: UpdateStatus) => void) => () => void
    }
  }
}

export {}
