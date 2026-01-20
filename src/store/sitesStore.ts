import { create } from 'zustand'

// Client information for monthly reports
export interface ClientInfo {
  name: string
  email: string
  company?: string
  phone?: string
  sendReports: boolean // Enable/disable monthly report emails
  reportDay?: number // Day of month to send report (1-28)
  lastReportSent?: string // ISO date of last report sent
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
  // Client information
  client?: ClientInfo
}

interface SitesState {
  sites: WordPressSite[]
  isLoading: boolean
  selectedSiteId: string | null

  // Actions
  loadSites: () => Promise<void>
  addSite: (site: Omit<WordPressSite, 'id' | 'createdAt' | 'status'>) => Promise<WordPressSite>
  updateSite: (id: string, updates: Partial<WordPressSite>) => Promise<void>
  deleteSite: (id: string) => Promise<void>
  selectSite: (id: string | null) => void
  refreshSiteStatus: (id: string) => Promise<void>
  refreshAllSites: () => Promise<void>
}

// Helper to check if electronAPI is available
const hasElectronAPI = () => typeof window !== 'undefined' && window.electronAPI

export const useSitesStore = create<SitesState>((set, get) => ({
  sites: [],
  isLoading: false,
  selectedSiteId: null,

  loadSites: async () => {
    set({ isLoading: true })
    try {
      if (hasElectronAPI()) {
        console.log('[WP Manager] Loading sites from electron store...')
        const sites = await window.electronAPI.getSites()
        console.log('[WP Manager] Sites loaded:', sites?.length || 0, 'sites')
        set({ sites: sites || [], isLoading: false })
      } else {
        console.warn('[WP Manager] electronAPI not available, using empty sites')
        set({ sites: [], isLoading: false })
      }
    } catch (error) {
      console.error('[WP Manager] Failed to load sites:', error)
      set({ sites: [], isLoading: false })
    }
  },

  addSite: async (siteData) => {
    set({ isLoading: true })
    try {
      let newSite: WordPressSite

      if (hasElectronAPI()) {
        console.log('[WP Manager] Adding site via electronAPI:', siteData.name)
        newSite = await window.electronAPI.addSite(siteData)
        console.log('[WP Manager] Site added successfully:', newSite.id)
      } else {
        console.warn('[WP Manager] No electronAPI, site will NOT be persisted!')
        newSite = {
          ...siteData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          status: 'pending',
        }
      }

      set((state) => ({
        sites: [...state.sites, newSite],
        isLoading: false,
      }))

      // Immediately check site status
      setTimeout(() => get().refreshSiteStatus(newSite.id), 500)

      return newSite
    } catch (error) {
      console.error('[WP Manager] Failed to add site:', error)
      set({ isLoading: false })
      throw error
    }
  },

  updateSite: async (id, updates) => {
    try {
      if (hasElectronAPI()) {
        const updated = await window.electronAPI.updateSite(id, updates)
        if (updated) {
          set((state) => ({
            sites: state.sites.map((s) => (s.id === id ? updated : s)),
          }))
        }
      } else {
        set((state) => ({
          sites: state.sites.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }))
      }
    } catch (error) {
      console.error('Failed to update site:', error)
    }
  },

  deleteSite: async (id) => {
    try {
      if (hasElectronAPI()) {
        await window.electronAPI.deleteSite(id)
      }
      set((state) => ({
        sites: state.sites.filter((s) => s.id !== id),
        selectedSiteId: state.selectedSiteId === id ? null : state.selectedSiteId,
      }))
    } catch (error) {
      console.error('Failed to delete site:', error)
    }
  },

  selectSite: (id) => {
    set({ selectedSiteId: id })
  },

  refreshSiteStatus: async (id) => {
    const site = get().sites.find((s) => s.id === id)
    if (!site) return

    // Update to pending while checking
    set((state) => ({
      sites: state.sites.map((s) => (s.id === id ? { ...s, status: 'pending' as const } : s)),
    }))

    try {
      if (hasElectronAPI() && window.electronAPI.checkSiteStatus) {
        // Use main process to check status (avoids CORS)
        const result = await window.electronAPI.checkSiteStatus({
          url: site.url,
          apiKey: site.apiKey,
          apiSecret: site.apiSecret,
        })

        const updates: Partial<WordPressSite> = {
          status: result.status,
          lastSync: new Date().toISOString(),
        }

        if (result.status === 'online' && result.data) {
          updates.wpVersion = result.data.wp_version
          updates.phpVersion = result.data.php_version
          updates.pluginCount = result.data.plugin_count
          updates.themeCount = result.data.theme_count
          updates.activeTheme = result.data.active_theme
        }

        await get().updateSite(id, updates)
      } else {
        // Fallback: just mark as offline
        await get().updateSite(id, { status: 'offline' })
      }
    } catch (error) {
      console.error('Failed to refresh site status:', error)
      await get().updateSite(id, { status: 'offline' })
    }
  },

  refreshAllSites: async () => {
    const sites = get().sites
    console.log('[WP Manager] Refreshing all sites:', sites.length)
    for (const site of sites) {
      await get().refreshSiteStatus(site.id)
    }
    console.log('[WP Manager] All sites refreshed')
  },
}))
