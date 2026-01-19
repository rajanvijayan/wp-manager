import { useState, useEffect } from 'react'
import { 
  Palette, 
  Search, 
  RefreshCw,
  CheckCircle,
  ArrowUpCircle,
  Eye,
  Download,
  Globe,
  Loader2
} from 'lucide-react'
import { useSitesStore } from '@/store/sitesStore'

interface ThemeInfo {
  name: string
  slug: string
  version: string
  status: 'active' | 'inactive'
  hasUpdate: boolean
  latestVersion?: string
  screenshot?: string
  siteId: string
  siteName: string
}

export default function Themes() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [themes, setThemes] = useState<ThemeInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [updatingThemes, setUpdatingThemes] = useState<Set<string>>(new Set())
  const sites = useSitesStore((state) => state.sites)

  const onlineSites = sites.filter(s => s.status === 'online')

  // Fetch themes from sites
  const fetchThemes = async () => {
    if (onlineSites.length === 0) {
      setThemes([])
      return
    }

    setIsLoading(true)
    const allThemes: ThemeInfo[] = []

    for (const site of onlineSites) {
      if (selectedSite !== 'all' && site.id !== selectedSite) continue

      try {
        if (window.electronAPI?.fetchFromSite) {
          const result = await window.electronAPI.fetchFromSite({
            url: `${site.url}/wp-json/wp-manager/v1/themes`,
            apiKey: site.apiKey,
            apiSecret: site.apiSecret,
          })

          if (result.ok && Array.isArray(result.data)) {
            result.data.forEach((theme: any) => {
              allThemes.push({
                ...theme,
                hasUpdate: theme.updateAvailable || false,
                siteId: site.id,
                siteName: site.name,
              })
            })
          }
        }
      } catch (error) {
        console.error(`Failed to fetch themes from ${site.name}:`, error)
      }
    }

    setThemes(allThemes)
    setIsLoading(false)
  }

  useEffect(() => {
    if (onlineSites.length > 0) {
      fetchThemes()
    }
  }, [selectedSite, sites])

  const filteredThemes = themes.filter(
    (theme) => theme.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const updatesAvailable = themes.filter((t) => t.hasUpdate).length
  const activeThemes = themes.filter((t) => t.status === 'active').length

  // Update a single theme
  const updateTheme = async (theme: ThemeInfo) => {
    const key = `${theme.siteId}-${theme.slug}`
    setUpdatingThemes(prev => new Set(prev).add(key))

    try {
      const site = sites.find(s => s.id === theme.siteId)
      if (!site) return

      const result = await window.electronAPI.fetchFromSite({
        url: `${site.url}/wp-json/wp-manager/v1/themes/${theme.slug}/update`,
        method: 'POST',
        apiKey: site.apiKey,
        apiSecret: site.apiSecret,
      })

      if (result.ok) {
        await fetchThemes()
      } else {
        alert(`Failed to update ${theme.name}`)
      }
    } catch (error) {
      console.error('Update failed:', error)
      alert(`Failed to update ${theme.name}`)
    } finally {
      setUpdatingThemes(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // Activate a theme
  const activateTheme = async (theme: ThemeInfo) => {
    const key = `${theme.siteId}-${theme.slug}`
    setUpdatingThemes(prev => new Set(prev).add(key))

    try {
      const site = sites.find(s => s.id === theme.siteId)
      if (!site) return

      const result = await window.electronAPI.fetchFromSite({
        url: `${site.url}/wp-json/wp-manager/v1/themes/${theme.slug}/activate`,
        method: 'POST',
        apiKey: site.apiKey,
        apiSecret: site.apiSecret,
      })

      if (result.ok) {
        await fetchThemes()
      } else {
        alert(`Failed to activate ${theme.name}`)
      }
    } catch (error) {
      console.error('Activation failed:', error)
      alert(`Failed to activate ${theme.name}`)
    } finally {
      setUpdatingThemes(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // Update all themes
  const updateAllThemes = async () => {
    const themesToUpdate = themes.filter(t => t.hasUpdate)
    for (const theme of themesToUpdate) {
      await updateTheme(theme)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Themes</h1>
          <p className="text-slate-400">
            Manage themes across all your WordPress sites
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchThemes}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {updatesAvailable > 0 && (
            <button 
              onClick={updateAllThemes}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-400 hover:to-emerald-500 transition-all hover-lift"
            >
              <Download className="w-5 h-5" />
              Update All ({updatesAvailable})
            </button>
          )}
        </div>
      </div>

      {/* Site selector & Search */}
      <div className="flex items-center gap-4">
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-wp-blue-500 transition-colors min-w-[200px]"
        >
          <option value="all">All Sites</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>{site.name}</option>
          ))}
        </select>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-wp-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Palette} label="Total Themes" value={themes.length} color="orange" />
        <StatCard icon={CheckCircle} label="Active" value={activeThemes} color="green" />
        <StatCard icon={ArrowUpCircle} label="Updates Available" value={updatesAvailable} color="blue" />
        <StatCard icon={Globe} label="Connected Sites" value={onlineSites.length} color="purple" />
      </div>

      {/* Themes Grid */}
      {onlineSites.length === 0 ? (
        <EmptyState message="Connect a WordPress site with the WP Manager plugin to see themes" />
      ) : isLoading ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="w-10 h-10 text-wp-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading themes...</p>
        </div>
      ) : themes.length === 0 ? (
        <EmptyState message="No themes found. Make sure the WP Manager plugin is installed on your sites." />
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filteredThemes.map((theme, index) => (
            <ThemeCard 
              key={`${theme.siteId}-${theme.slug}-${index}`} 
              theme={theme} 
              isUpdating={updatingThemes.has(`${theme.siteId}-${theme.slug}`)}
              onUpdate={() => updateTheme(theme)}
              onActivate={() => activateTheme(theme)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ThemeCard({ 
  theme, 
  isUpdating, 
  onUpdate, 
  onActivate 
}: { 
  theme: ThemeInfo
  isUpdating: boolean
  onUpdate: () => void
  onActivate: () => void
}) {
  const [imageError, setImageError] = useState(false)
  
  // Check if screenshot URL is valid
  const hasValidScreenshot = theme.screenshot && !imageError
  
  return (
    <div className="glass rounded-2xl overflow-hidden hover-lift group">
      {/* Theme preview */}
      <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
        {hasValidScreenshot ? (
          <img 
            src={theme.screenshot} 
            alt={theme.name} 
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Palette className="w-12 h-12 text-slate-600" />
            <span className="text-slate-500 text-sm font-medium">{theme.name}</span>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
            <Eye className="w-5 h-5" />
          </button>
        </div>
        
        {/* Active badge */}
        {theme.status === 'active' && (
          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium">
            Active
          </div>
        )}
        
        {/* Site badge */}
        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/50 text-white text-xs">
          {theme.siteName}
        </div>
      </div>
      
      {/* Theme info */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{theme.name}</h3>
            <p className="text-sm text-slate-400 font-mono">v{theme.version}</p>
          </div>
          {theme.hasUpdate && theme.latestVersion && (
            <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-medium">
              v{theme.latestVersion}
            </span>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {theme.hasUpdate ? (
            <button 
              onClick={onUpdate}
              disabled={isUpdating}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-wp-blue-500 text-white text-sm font-medium hover:bg-wp-blue-400 transition-colors disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Update
                </>
              )}
            </button>
          ) : (
            <span className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
              <CheckCircle className="w-4 h-4" />
              Up to date
            </span>
          )}
          {theme.status !== 'active' && (
            <button 
              onClick={onActivate}
              disabled={isUpdating}
              className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Activate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any
  label: string
  value: number
  color: 'blue' | 'green' | 'orange' | 'purple'
}) {
  const bgColors = {
    blue: 'bg-gradient-to-br from-wp-blue-500 to-wp-blue-600',
    green: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
    purple: 'bg-gradient-to-br from-violet-500 to-violet-600',
  }

  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bgColors[color]} flex items-center justify-center`}>
        <Icon className="w-6 h-6" style={{ color: '#ffffff' }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
        <Palette className="w-10 h-10" style={{ color: '#ffffff' }} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No themes to display</h3>
      <p className="text-slate-400">{message}</p>
    </div>
  )
}
