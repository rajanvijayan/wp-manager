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
    <header className="h-12 bg-slate-925/80 border-b border-white/5 flex items-center justify-between px-4 titlebar-drag-region relative z-50">
      {/* macOS traffic lights space */}
      <div className="w-20" />
      
      {/* App title */}
      <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
        <AppIconSimple size={24} />
        <span className="text-sm font-medium text-slate-300">WP Manager</span>
        <UpdateBadge />
      </div>
      
      {/* Window controls (Windows/Linux) */}
      {!isMac && (
        <div className="flex items-center gap-1 titlebar-no-drag">
          <button
            onClick={handleMinimize}
            className="p-2 hover:bg-white/10 rounded-md transition-colors"
          >
            <Minus className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-2 hover:bg-white/10 rounded-md transition-colors"
          >
            {isMaximized ? (
              <Copy className="w-4 h-4 text-slate-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-500/80 rounded-md transition-colors group"
          >
            <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </button>
        </div>
      )}
      
      {/* Spacer for macOS */}
      {isMac && <div className="w-20" />}
    </header>
  )
}
