import { useState, useEffect } from 'react'
import { Minus, Square, X, Copy } from 'lucide-react'
import { AppIconSimple } from '@/components/AppIcon'
import { UpdateBadge } from '@/components/UpdateNotification'

export default function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    // Detect platform from user agent
    setIsMac(navigator.userAgent.toLowerCase().includes('mac'))

    const checkMaximized = async () => {
      try {
        if (window.electronAPI?.isMaximized) {
          const maximized = await window.electronAPI.isMaximized()
          setIsMaximized(maximized)
        }
      } catch (e) {
        console.error('Failed to check maximized state:', e)
      }
    }
    checkMaximized()

    // Check on window resize
    const handleResize = () => checkMaximized()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMinimize = () => {
    try {
      window.electronAPI?.minimizeWindow()
    } catch (e) {
      console.error('Failed to minimize:', e)
    }
  }

  const handleMaximize = async () => {
    try {
      window.electronAPI?.maximizeWindow()
      setIsMaximized(!isMaximized)
    } catch (e) {
      console.error('Failed to maximize:', e)
    }
  }

  const handleClose = () => {
    try {
      window.electronAPI?.closeWindow()
    } catch (e) {
      console.error('Failed to close:', e)
    }
  }

  return (
    <header className="titlebar-drag-region relative z-50 flex h-12 items-center justify-between border-b border-white/5 bg-slate-925/80 px-4">
      {/* macOS traffic lights space */}
      <div className="w-20" />

      {/* App title */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
        <AppIconSimple size={24} />
        <span className="text-sm font-medium text-slate-300">WP Manager</span>
        <UpdateBadge />
      </div>

      {/* Window controls (Windows/Linux) */}
      {!isMac && (
        <div className="titlebar-no-drag flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="rounded-md p-2 transition-colors hover:bg-white/10"
          >
            <Minus className="h-4 w-4 text-slate-400" />
          </button>
          <button
            onClick={handleMaximize}
            className="rounded-md p-2 transition-colors hover:bg-white/10"
          >
            {isMaximized ? (
              <Copy className="h-4 w-4 text-slate-400" />
            ) : (
              <Square className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="group rounded-md p-2 transition-colors hover:bg-red-500/80"
          >
            <X className="h-4 w-4 text-slate-400 group-hover:text-white" />
          </button>
        </div>
      )}

      {/* Spacer for macOS */}
      {isMac && <div className="w-20" />}
    </header>
  )
}
