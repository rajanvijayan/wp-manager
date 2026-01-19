import { contextBridge, ipcRenderer } from 'electron'

// Client information for monthly reports
export interface ClientInfo {
  name: string
  email: string
  company?: string
  phone?: string
  sendReports: boolean
  reportDay?: number
  lastReportSent?: string
}

// WordPress Site type
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
  client?: ClientInfo
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

// Update status types
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

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Site management
  getSites: (): Promise<WordPressSite[]> => ipcRenderer.invoke('get-sites'),
  addSite: (site: Omit<WordPressSite, 'id' | 'createdAt' | 'status'>): Promise<WordPressSite> =>
    ipcRenderer.invoke('add-site', site),
  updateSite: (id: string, updates: Partial<WordPressSite>): Promise<WordPressSite | null> =>
    ipcRenderer.invoke('update-site', { id, updates }),
  deleteSite: (id: string): Promise<boolean> => ipcRenderer.invoke('delete-site', id),

  // Check site status (CORS-free from main process)
  checkSiteStatus: (params: {
    url: string
    apiKey: string
    apiSecret: string
  }): Promise<SiteStatusResult> => ipcRenderer.invoke('check-site-status', params),

  // Generic fetch from site (CORS-free)
  fetchFromSite: (params: {
    url: string
    method?: string
    apiKey: string
    apiSecret: string
    body?: any
  }): Promise<{ ok: boolean; status: number; data: any }> =>
    ipcRenderer.invoke('fetch-from-site', params),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('is-maximized'),

  // Settings
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: AppSettings): Promise<AppSettings> =>
    ipcRenderer.invoke('save-settings', settings),
  getSetting: (key: string): Promise<any> => ipcRenderer.invoke('get-setting', key),
  saveSetting: (key: string, value: any): Promise<AppSettings> =>
    ipcRenderer.invoke('save-setting', { key, value }),

  // Auto-updater
  updaterCheck: (): Promise<{
    status: string
    updateAvailable?: boolean
    version?: string
    message?: string
  }> => ipcRenderer.invoke('updater-check'),
  updaterDownload: (): Promise<{ status: string; message?: string }> =>
    ipcRenderer.invoke('updater-download'),
  updaterInstall: (): Promise<{ status: string; message?: string }> =>
    ipcRenderer.invoke('updater-install'),
  updaterGetStatus: (): Promise<UpdaterStatus> => ipcRenderer.invoke('updater-get-status'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),

  // Listen for update events from main process
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => {
    const handler = (_event: any, status: UpdateStatus) => callback(status)
    ipcRenderer.on('update-status', handler)
    return () => ipcRenderer.removeListener('update-status', handler)
  },
})

// Type declarations are in src/types/electron.d.ts
