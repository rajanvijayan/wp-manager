import { app, BrowserWindow, ipcMain, shell, net, nativeImage, dialog } from 'electron'
import path from 'path'
import Store from 'electron-store'
import { autoUpdater, UpdateInfo } from 'electron-updater'

// Configure auto-updater
autoUpdater.autoDownload = false // Don't auto-download, let user decide
autoUpdater.autoInstallOnAppQuit = true

// Set app name - this affects menu bar and some UI elements
app.setName('WP Manager')

// On macOS, try to change the dock menu title
if (process.platform === 'darwin') {
  // This sets the name in the application menu
  app.name = 'WP Manager'
}

// Single instance lock - prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log('[WP Manager] Another instance is already running. Quitting...')
  app.quit()
} else {
  // Focus existing window when another instance tries to start
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// Initialize secure store for credentials
const store = new Store({
  name: 'wp-manager-data',
  encryptionKey: 'wp-manager-secure-key-2024', // In production, use a more secure key
})

// Log store path on startup for debugging
console.log('[WP Manager] Store initialized at:', store.path)
console.log('[WP Manager] Initial sites count:', (store.get('sites', []) as any[]).length)

let mainWindow: BrowserWindow | null = null

// Check if running in development
const isDev = !app.isPackaged

function createWindow() {
  // Try to load icon - use app.getAppPath() for more reliable path resolution
  let icon
  try {
    // In development, __dirname is dist-electron, so we go up one level to find build/
    // In production, the path will be different
    const iconPath = isDev
      ? path.join(__dirname, '../build/icon.png')
      : path.join(process.resourcesPath || __dirname, 'icon.png')

    console.log('[WP Manager] Loading icon from:', iconPath)

    if (require('fs').existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath)
      if (!icon.isEmpty()) {
        console.log('[WP Manager] Icon loaded successfully, size:', icon.getSize())
      } else {
        console.log('[WP Manager] Icon loaded but is empty')
      }
    } else {
      console.log('[WP Manager] Icon file not found at:', iconPath)
    }
  } catch (e) {
    console.log('[WP Manager] Error loading icon:', e)
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'WP Manager',
    frame: false, // Custom title bar
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
    backgroundColor: '#080c14',
    icon: icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
    // Open DevTools for debugging (remove in production)
    if (isDev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Log any load errors
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App lifecycle
app.whenReady().then(() => {
  // Set dock icon on macOS as early as possible
  if (process.platform === 'darwin' && app.dock) {
    const iconPath = path.join(__dirname, '../build/icon.png')
    console.log('[WP Manager] Setting dock icon from:', iconPath)
    if (require('fs').existsSync(iconPath)) {
      const dockIcon = nativeImage.createFromPath(iconPath)
      if (!dockIcon.isEmpty()) {
        app.dock.setIcon(dockIcon)
        // Bounce the dock icon to force refresh
        app.dock.bounce('informational')
        console.log('[WP Manager] Dock icon set successfully')
      }
    }
  }
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Helper function to make HTTP requests using Electron's net module (no CORS)
async function fetchUrl(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: any
  } = {}
): Promise<{ ok: boolean; status: number; data: any }> {
  return new Promise((resolve) => {
    try {
      const request = net.request({
        url,
        method: options.method || 'GET',
      })

      // Set headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          request.setHeader(key, value)
        })
      }

      // Set content type for POST requests
      if (options.method === 'POST') {
        request.setHeader('Content-Type', 'application/json')
      }

      let responseData = ''

      request.on('response', (response) => {
        response.on('data', (chunk) => {
          responseData += chunk.toString()
        })

        response.on('end', () => {
          let data = null
          try {
            data = JSON.parse(responseData)
          } catch {
            data = responseData
          }
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            data,
          })
        })
      })

      request.on('error', (error) => {
        console.error('Request error:', error)
        resolve({ ok: false, status: 0, data: null })
      })

      // Send body for POST requests
      if (options.body && options.method === 'POST') {
        request.write(JSON.stringify(options.body))
      }

      request.end()
    } catch (error) {
      console.error('Fetch error:', error)
      resolve({ ok: false, status: 0, data: null })
    }
  })
}

// IPC Handlers for site management
ipcMain.handle('get-sites', () => {
  const sites = store.get('sites', [])
  console.log('[WP Manager] Loading sites from store:', sites?.length || 0, 'sites found')
  console.log('[WP Manager] Store path:', store.path)
  return sites
})

ipcMain.handle('add-site', (_, site) => {
  const sites = store.get('sites', []) as any[]
  const newSite = {
    ...site,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  }
  sites.push(newSite)
  store.set('sites', sites)
  console.log('[WP Manager] Site added and saved:', newSite.name, '| Total sites:', sites.length)
  return newSite
})

ipcMain.handle('update-site', (_, { id, updates }) => {
  const sites = store.get('sites', []) as any[]
  const index = sites.findIndex((s: any) => s.id === id)
  if (index !== -1) {
    sites[index] = { ...sites[index], ...updates }
    store.set('sites', sites)
    console.log('[WP Manager] Site updated:', sites[index].name)
    return sites[index]
  }
  return null
})

ipcMain.handle('delete-site', (_, id) => {
  const sites = store.get('sites', []) as any[]
  const filtered = sites.filter((s: any) => s.id !== id)
  store.set('sites', filtered)
  console.log('[WP Manager] Site deleted. Remaining sites:', filtered.length)
  return true
})

// Generic fetch from site (handles CORS by making request from main process)
ipcMain.handle('fetch-from-site', async (_, { url, method = 'GET', apiKey, apiSecret, body }) => {
  try {
    const result = await fetchUrl(url, {
      method,
      headers: {
        'X-WP-Manager-Key': apiKey,
        'X-WP-Manager-Secret': apiSecret,
      },
      body,
    })
    return result
  } catch (error) {
    console.error('Fetch from site error:', error)
    return { ok: false, status: 0, data: null }
  }
})

// Check site status (handles CORS by making request from main process)
ipcMain.handle('check-site-status', async (_, { url, apiKey, apiSecret }) => {
  try {
    // First check if basic WordPress REST API is available
    const basicResult = await fetchUrl(`${url}/wp-json/`)

    if (!basicResult.ok) {
      return { status: 'offline', data: null }
    }

    // Site is reachable, now try our plugin endpoint
    const pluginResult = await fetchUrl(`${url}/wp-json/wp-manager/v1/status`, {
      headers: {
        'X-WP-Manager-Key': apiKey,
        'X-WP-Manager-Secret': apiSecret,
      },
    })

    if (pluginResult.ok) {
      return { status: 'online', data: pluginResult.data }
    } else if (pluginResult.status === 404) {
      // Plugin not installed
      return { status: 'no-plugin', data: basicResult.data }
    } else if (pluginResult.status === 403) {
      // Auth error
      return { status: 'error', data: null }
    } else {
      // Plugin not installed (other error)
      return { status: 'no-plugin', data: basicResult.data }
    }
  } catch (error) {
    console.error('Check site status error:', error)
    return { status: 'offline', data: null }
  }
})

// Window controls
ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.handle('window-close', () => {
  mainWindow?.close()
})

ipcMain.handle('is-maximized', () => {
  return mainWindow?.isMaximized()
})

// Settings management
ipcMain.handle('get-settings', () => {
  return store.get('settings', {
    darkMode: true,
    autoSync: true,
    syncInterval: '30',
    notifications: true,
    updateAlerts: true,
    siteDownAlerts: true,
  })
})

ipcMain.handle('save-settings', (_, settings) => {
  store.set('settings', settings)
  return settings
})

ipcMain.handle('get-setting', (_, key: string) => {
  const settings = store.get('settings', {}) as Record<string, any>
  return settings[key]
})

ipcMain.handle('save-setting', (_, { key, value }) => {
  const settings = store.get('settings', {}) as Record<string, any>
  settings[key] = value
  store.set('settings', settings)
  return settings
})

// ============================================
// AUTO-UPDATER MODULE
// ============================================

// Update state
let updateAvailable = false
let updateDownloaded = false
let updateInfo: UpdateInfo | null = null
let downloadProgress = 0

// Send update status to renderer
function sendUpdateStatus(status: string, data?: any) {
  if (mainWindow) {
    mainWindow.webContents.send('update-status', { status, data })
  }
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('[WP Manager] Checking for updates...')
  sendUpdateStatus('checking')
})

autoUpdater.on('update-available', (info: UpdateInfo) => {
  console.log('[WP Manager] Update available:', info.version)
  updateAvailable = true
  updateInfo = info
  sendUpdateStatus('available', {
    version: info.version,
    releaseDate: info.releaseDate,
    releaseNotes: info.releaseNotes,
  })
})

autoUpdater.on('update-not-available', (info: UpdateInfo) => {
  console.log('[WP Manager] No updates available. Current version:', info.version)
  updateAvailable = false
  sendUpdateStatus('not-available', { version: info.version })
})

autoUpdater.on('download-progress', (progress) => {
  downloadProgress = progress.percent
  console.log(`[WP Manager] Download progress: ${progress.percent.toFixed(1)}%`)
  sendUpdateStatus('downloading', {
    percent: progress.percent,
    bytesPerSecond: progress.bytesPerSecond,
    transferred: progress.transferred,
    total: progress.total,
  })
})

autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
  console.log('[WP Manager] Update downloaded:', info.version)
  updateDownloaded = true
  sendUpdateStatus('downloaded', {
    version: info.version,
    releaseNotes: info.releaseNotes,
  })

  // Show notification to user
  if (mainWindow) {
    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: `Version ${info.version} has been downloaded.`,
        detail:
          'The update will be installed when you restart the app. Would you like to restart now?',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall(false, true)
        }
      })
  }
})

autoUpdater.on('error', (error) => {
  console.error('[WP Manager] Auto-updater error:', error)
  sendUpdateStatus('error', { message: error.message })
})

// Check for updates on app ready (only in production)
app.whenReady().then(() => {
  if (!isDev) {
    // Check for updates after a short delay
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('[WP Manager] Failed to check for updates:', err)
      })
    }, 3000)

    // Check for updates every 4 hours
    setInterval(
      () => {
        autoUpdater.checkForUpdates().catch((err) => {
          console.error('[WP Manager] Failed to check for updates:', err)
        })
      },
      4 * 60 * 60 * 1000
    )
  }
})

// IPC Handlers for auto-updater
ipcMain.handle('updater-check', async () => {
  try {
    if (isDev) {
      return { status: 'dev-mode', message: 'Updates are disabled in development mode' }
    }
    const result = await autoUpdater.checkForUpdates()
    return {
      status: 'checked',
      updateAvailable: result?.updateInfo ? true : false,
      version: result?.updateInfo?.version,
    }
  } catch (error: any) {
    return { status: 'error', message: error.message }
  }
})

ipcMain.handle('updater-download', async () => {
  try {
    if (!updateAvailable) {
      return { status: 'no-update', message: 'No update available to download' }
    }
    await autoUpdater.downloadUpdate()
    return { status: 'downloading' }
  } catch (error: any) {
    return { status: 'error', message: error.message }
  }
})

ipcMain.handle('updater-install', () => {
  if (updateDownloaded) {
    autoUpdater.quitAndInstall(false, true)
    return { status: 'installing' }
  }
  return { status: 'not-ready', message: 'Update not downloaded yet' }
})

ipcMain.handle('updater-get-status', () => {
  return {
    updateAvailable,
    updateDownloaded,
    downloadProgress,
    currentVersion: app.getVersion(),
    updateVersion: updateInfo?.version || null,
    releaseNotes: updateInfo?.releaseNotes || null,
  }
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})
