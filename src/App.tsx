import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import TitleBar from './components/layout/TitleBar'
import Dashboard from './pages/Dashboard'
import Sites from './pages/Sites'
import Plugins from './pages/Plugins'
import Themes from './pages/Themes'
import Settings from './pages/Settings'
import { useSitesStore } from './store/sitesStore'
import { useThemeStore } from './store/themeStore'
import AppIcon from './components/AppIcon'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadSites = useSitesStore((state) => state.loadSites)
  const { darkMode, loadTheme } = useThemeStore()

  useEffect(() => {
    const init = async () => {
      try {
        await loadTheme()
        await loadSites()
      } catch (e) {
        console.error('Failed to initialize:', e)
        setError('Failed to initialize')
      } finally {
        setTimeout(() => setIsLoading(false), 500)
      }
    }
    init()
  }, [loadSites, loadTheme])

  // Apply theme class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light-mode')
    } else {
      document.documentElement.classList.add('light-mode')
    }
  }, [darkMode])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return <ErrorScreen message={error} />
  }

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-slate-950 overflow-hidden">
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/plugins" element={<Plugins />} />
              <Route path="/themes" element={<Themes />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-6 animate-pulse-slow">
            <AppIcon size={96} />
          </div>
          <h1 className="text-2xl font-semibold text-gradient mb-2">WP Manager</h1>
          <p className="text-slate-500 text-sm">Loading your sites...</p>
        </div>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Something went wrong</h1>
        <p className="text-slate-400 text-sm">{message}</p>
      </div>
    </div>
  )
}

export default App
