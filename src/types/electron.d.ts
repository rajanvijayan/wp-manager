export interface ClientInfo {
  name: string
  email: string
  company?: string
  phone?: string
  sendReports: boolean
  reportDay?: number
  lastReportSent?: string
}

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

export interface WpOrgPlugin {
  name: string
  slug: string
  version: string
  author: string
  author_profile: string
  requires: string
  tested: string
  requires_php: string
  rating: number
  ratings: Record<number, number>
  num_ratings: number
  support_threads: number
  support_threads_resolved: number
  active_installs: number
  downloaded: number
  last_updated: string
  added: string
  homepage: string
  short_description: string
  description: string
  download_link: string
  icons: Record<string, string>
  banners: Record<string, string>
}

export interface WpOrgTheme {
  name: string
  slug: string
  version: string
  preview_url: string
  author: string
  screenshot_url: string
  rating: number
  num_ratings: number
  homepage: string
  description: string
  download_link: string
}

export interface SiteUser {
  id: number
  username: string
  email: string
  display_name: string
  roles: string[]
  registered: string
}

export interface SiteStats {
  file_count: number
  db_size: string
  db_size_bytes: number
  uploads_size: string
  uploads_size_bytes: number
  total_posts: number
  total_pages: number
  total_comments: number
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
      addSite: (site: Omit<WordPressSite, 'id' | 'createdAt' | 'status'>) => Promise<WordPressSite>
      updateSite: (id: string, updates: Partial<WordPressSite>) => Promise<WordPressSite | null>
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
      // Plugin/Theme search & install
      searchWpPlugins: (query: string) => Promise<{ ok: boolean; plugins: WpOrgPlugin[] }>
      searchWpThemes: (query: string) => Promise<{ ok: boolean; themes: WpOrgTheme[] }>
      installPlugin: (params: {
        siteUrl: string
        apiKey: string
        apiSecret: string
        pluginSlug: string
      }) => Promise<{ ok: boolean; status: number; data: any }>
      installTheme: (params: {
        siteUrl: string
        apiKey: string
        apiSecret: string
        themeSlug: string
      }) => Promise<{ ok: boolean; status: number; data: any }>
      // Admin auto-login
      getAdminLoginUrl: (params: {
        siteUrl: string
        apiKey: string
        apiSecret: string
      }) => Promise<{ ok: boolean; loginUrl: string | null }>
      openExternalUrl: (url: string) => Promise<{ ok: boolean }>
      // Site details
      getSiteUsers: (params: {
        siteUrl: string
        apiKey: string
        apiSecret: string
      }) => Promise<{ ok: boolean; users: SiteUser[] }>
      getSiteStats: (params: {
        siteUrl: string
        apiKey: string
        apiSecret: string
      }) => Promise<{ ok: boolean; stats: SiteStats | null }>
    }
  }
}

export {}
