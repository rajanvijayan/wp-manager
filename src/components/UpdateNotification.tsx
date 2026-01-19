import { useEffect } from 'react'
import { Download, RefreshCw, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { useUpdaterStore } from '@/store/updaterStore'

export function UpdateNotification() {
  const {
    currentVersion,
    updateStatus,
    isChecking,
    isDownloading,
    initialize,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  } = useUpdaterStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  const renderStatus = () => {
    switch (updateStatus.status) {
      case 'checking':
        return (
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Checking for updates...</span>
          </div>
        )

      case 'available':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-emerald-400">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">New version available: v{updateStatus.version}</span>
            </div>
            {updateStatus.releaseNotes && (
              <div className="max-h-32 overflow-y-auto rounded-lg bg-white/5 p-3 text-sm text-slate-400">
                {typeof updateStatus.releaseNotes === 'string'
                  ? updateStatus.releaseNotes
                  : 'See release notes on GitHub'}
              </div>
            )}
            <button
              onClick={downloadUpdate}
              disabled={isDownloading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 font-medium text-white transition-all hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download Update
            </button>
          </div>
        )

      case 'downloading':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-wp-blue-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Downloading update...</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-wp-blue-500 to-wp-blue-400 transition-all duration-300"
                style={{ width: `${updateStatus.downloadProgress || 0}%` }}
              />
            </div>
            <p className="text-sm text-slate-400">
              {(updateStatus.downloadProgress || 0).toFixed(1)}% complete
            </p>
          </div>
        )

      case 'downloaded':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Update ready to install (v{updateStatus.version})</span>
            </div>
            <p className="text-sm text-slate-400">Restart the app to apply the update.</p>
            <button
              onClick={installUpdate}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 font-medium text-white transition-all hover:from-emerald-400 hover:to-emerald-500"
            >
              <RefreshCw className="h-4 w-4" />
              Restart & Install
            </button>
          </div>
        )

      case 'not-available':
        return (
          <div className="flex items-center gap-3 text-slate-400">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span>You're on the latest version</span>
          </div>
        )

      case 'error':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>Update check failed</span>
            </div>
            {updateStatus.error && <p className="text-sm text-slate-500">{updateStatus.error}</p>}
          </div>
        )

      default:
        return (
          <div className="flex items-center gap-3 text-slate-400">
            <span>Click to check for updates</span>
          </div>
        )
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Software Updates</h3>
            <p className="text-sm text-slate-400">Current version: v{currentVersion}</p>
          </div>
        </div>

        <button
          onClick={checkForUpdates}
          disabled={isChecking || isDownloading}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          Check Now
        </button>
      </div>

      <div className="border-t border-white/10 pt-4">{renderStatus()}</div>
    </div>
  )
}

// Floating update badge for the title bar
export function UpdateBadge() {
  const { updateStatus, initialize } = useUpdaterStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (updateStatus.status !== 'available' && updateStatus.status !== 'downloaded') {
    return null
  }

  return (
    <div className="flex animate-pulse items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
      <Sparkles className="h-3 w-3" />
      {updateStatus.status === 'downloaded' ? 'Update Ready' : 'Update Available'}
    </div>
  )
}
