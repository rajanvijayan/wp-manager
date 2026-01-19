import { create } from 'zustand'

interface UpdateStatus {
  status:
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error'
  version?: string
  releaseNotes?: string | null
  downloadProgress?: number
  error?: string
}

interface UpdaterState {
  currentVersion: string
  updateStatus: UpdateStatus
  isChecking: boolean
  isDownloading: boolean

  // Actions
  initialize: () => Promise<void>
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  setStatus: (status: UpdateStatus) => void
}

export const useUpdaterStore = create<UpdaterState>((set) => ({
  currentVersion: '1.0.0',
  updateStatus: { status: 'idle' },
  isChecking: false,
  isDownloading: false,

  initialize: async () => {
    try {
      if (window.electronAPI?.getAppVersion) {
        const version = await window.electronAPI.getAppVersion()
        set({ currentVersion: version })
      }

      // Listen for update events from main process
      if (window.electronAPI?.onUpdateStatus) {
        window.electronAPI.onUpdateStatus((status) => {
          console.log('[Updater] Status update:', status)

          switch (status.status) {
            case 'checking':
              set({ isChecking: true, updateStatus: { status: 'checking' } })
              break
            case 'available':
              set({
                isChecking: false,
                updateStatus: {
                  status: 'available',
                  version: status.data?.version,
                  releaseNotes: status.data?.releaseNotes as string | null,
                },
              })
              break
            case 'not-available':
              set({
                isChecking: false,
                updateStatus: { status: 'not-available', version: status.data?.version },
              })
              break
            case 'downloading':
              set({
                isDownloading: true,
                updateStatus: {
                  status: 'downloading',
                  downloadProgress: status.data?.percent,
                },
              })
              break
            case 'downloaded':
              set({
                isDownloading: false,
                updateStatus: {
                  status: 'downloaded',
                  version: status.data?.version,
                  releaseNotes: status.data?.releaseNotes as string | null,
                },
              })
              break
            case 'error':
              set({
                isChecking: false,
                isDownloading: false,
                updateStatus: { status: 'error', error: status.data?.message },
              })
              break
          }
        })
      }

      // Get initial status
      if (window.electronAPI?.updaterGetStatus) {
        const status = await window.electronAPI.updaterGetStatus()
        if (status.updateAvailable) {
          set({
            updateStatus: {
              status: status.updateDownloaded ? 'downloaded' : 'available',
              version: status.updateVersion || undefined,
              releaseNotes: status.releaseNotes,
              downloadProgress: status.downloadProgress,
            },
          })
        }
      }
    } catch (error) {
      console.error('[Updater] Failed to initialize:', error)
    }
  },

  checkForUpdates: async () => {
    try {
      set({ isChecking: true, updateStatus: { status: 'checking' } })

      if (window.electronAPI?.updaterCheck) {
        const result = await window.electronAPI.updaterCheck()

        if (result.status === 'dev-mode') {
          set({
            isChecking: false,
            updateStatus: { status: 'not-available', error: result.message },
          })
        } else if (result.status === 'error') {
          set({
            isChecking: false,
            updateStatus: { status: 'error', error: result.message },
          })
        }
        // Other statuses will be handled by the event listener
      }
    } catch (error: any) {
      set({
        isChecking: false,
        updateStatus: { status: 'error', error: error.message },
      })
    }
  },

  downloadUpdate: async () => {
    try {
      set({ isDownloading: true })

      if (window.electronAPI?.updaterDownload) {
        await window.electronAPI.updaterDownload()
      }
    } catch (error: any) {
      set({
        isDownloading: false,
        updateStatus: { status: 'error', error: error.message },
      })
    }
  },

  installUpdate: async () => {
    try {
      if (window.electronAPI?.updaterInstall) {
        await window.electronAPI.updaterInstall()
      }
    } catch (error: any) {
      console.error('[Updater] Failed to install:', error)
    }
  },

  setStatus: (status) => {
    set({ updateStatus: status })
  },
}))
