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
  Loader2,
  Plus,
  X,
  Star,
  Check,
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

interface WpOrgTheme {
  name: string
  slug: string
  version: string
  author: string
  rating: number
  num_ratings: number
  screenshot_url: string
  preview_url: string
}

export default function Themes() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [themes, setThemes] = useState<ThemeInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [updatingThemes, setUpdatingThemes] = useState<Set<string>>(new Set())
  const [showInstallModal, setShowInstallModal] = useState(false)
  const sites = useSitesStore((state) => state.sites)

  const onlineSites = sites.filter((s) => s.status === 'online')

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

  const filteredThemes = themes.filter((theme) =>
    theme.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const updatesAvailable = themes.filter((t) => t.hasUpdate).length
  const activeThemes = themes.filter((t) => t.status === 'active').length

  // Update a single theme
  const updateTheme = async (theme: ThemeInfo) => {
    const key = `${theme.siteId}-${theme.slug}`
    setUpdatingThemes((prev) => new Set(prev).add(key))

    try {
      const site = sites.find((s) => s.id === theme.siteId)
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
      setUpdatingThemes((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // Activate a theme
  const activateTheme = async (theme: ThemeInfo) => {
    const key = `${theme.siteId}-${theme.slug}`
    setUpdatingThemes((prev) => new Set(prev).add(key))

    try {
      const site = sites.find((s) => s.id === theme.siteId)
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
      setUpdatingThemes((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // Update all themes
  const updateAllThemes = async () => {
    const themesToUpdate = themes.filter((t) => t.hasUpdate)
    for (const theme of themesToUpdate) {
      await updateTheme(theme)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Themes</h1>
          <p className="text-slate-400">Manage themes across all your WordPress sites</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 font-medium text-white transition-all hover:from-orange-400 hover:to-orange-500"
          >
            <Plus className="h-5 w-5" />
            Install New
          </button>
          <button
            onClick={fetchThemes}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {updatesAvailable > 0 && (
            <button
              onClick={updateAllThemes}
              className="hover-lift flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 font-medium text-white transition-all hover:from-emerald-400 hover:to-emerald-500"
            >
              <Download className="h-5 w-5" />
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
          className="min-w-[200px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-colors focus:border-wp-blue-500 focus:outline-none"
        >
          <option value="all">All Sites</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>

        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search themes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-400 transition-colors focus:border-wp-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Palette} label="Total Themes" value={themes.length} color="orange" />
        <StatCard icon={CheckCircle} label="Active" value={activeThemes} color="green" />
        <StatCard
          icon={ArrowUpCircle}
          label="Updates Available"
          value={updatesAvailable}
          color="blue"
        />
        <StatCard icon={Globe} label="Connected Sites" value={onlineSites.length} color="purple" />
      </div>

      {/* Themes Grid */}
      {onlineSites.length === 0 ? (
        <EmptyState message="Connect a WordPress site with the WP Manager plugin to see themes" />
      ) : isLoading ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-wp-blue-400" />
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

      {/* Install Theme Modal */}
      {showInstallModal && (
        <InstallThemeModal
          sites={onlineSites}
          onClose={() => setShowInstallModal(false)}
          onInstalled={fetchThemes}
        />
      )}
    </div>
  )
}

function InstallThemeModal({
  sites,
  onClose,
  onInstalled,
}: {
  sites: any[]
  onClose: () => void
  onInstalled: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WpOrgTheme[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set())
  const [selectedTheme, setSelectedTheme] = useState<WpOrgTheme | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installResults, setInstallResults] = useState<
    { siteId: string; siteName: string; success: boolean; message?: string }[]
  >([])

  const searchThemes = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const result = await window.electronAPI.searchWpThemes(searchQuery)
      if (result.ok) {
        setSearchResults(result.themes)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const toggleSite = (siteId: string) => {
    setSelectedSites((prev) => {
      const next = new Set(prev)
      if (next.has(siteId)) {
        next.delete(siteId)
      } else {
        next.add(siteId)
      }
      return next
    })
  }

  const selectAllSites = () => {
    setSelectedSites(new Set(sites.map((s) => s.id)))
  }

  const installTheme = async () => {
    if (!selectedTheme || selectedSites.size === 0) return

    setIsInstalling(true)
    const results: { siteId: string; siteName: string; success: boolean; message?: string }[] = []

    for (const siteId of selectedSites) {
      const site = sites.find((s) => s.id === siteId)
      if (!site) continue

      try {
        const result = await window.electronAPI.installTheme({
          siteUrl: site.url,
          apiKey: site.apiKey,
          apiSecret: site.apiSecret,
          themeSlug: selectedTheme.slug,
        })

        results.push({
          siteId: site.id,
          siteName: site.name,
          success: result.ok,
          message: result.ok ? 'Installed successfully' : 'Installation failed',
        })
      } catch (error) {
        results.push({
          siteId: site.id,
          siteName: site.name,
          success: false,
          message: 'Installation error',
        })
      }
    }

    setInstallResults(results)
    setIsInstalling(false)
    onInstalled()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="glass relative mx-4 max-h-[90vh] w-full max-w-3xl animate-slide-up overflow-y-auto rounded-2xl p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 text-2xl font-bold text-white">Install New Theme</h2>
        <p className="mb-6 text-slate-400">
          Search WordPress.org and install themes on multiple sites at once
        </p>

        {/* Search */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search WordPress themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchThemes()}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-400 transition-colors focus:border-wp-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={searchThemes}
            disabled={isSearching}
            className="flex items-center gap-2 rounded-xl bg-wp-blue-500 px-5 py-3 font-medium text-white transition-colors hover:bg-wp-blue-400 disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
            Search
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && !selectedTheme && (
          <div className="mb-6 grid max-h-[300px] grid-cols-2 gap-3 overflow-y-auto">
            {searchResults.map((theme) => (
              <button
                key={theme.slug}
                onClick={() => setSelectedTheme(theme)}
                className="flex gap-3 rounded-xl border border-white/10 p-3 text-left transition-colors hover:bg-white/5"
              >
                <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                  {theme.screenshot_url ? (
                    <img src={theme.screenshot_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Palette className="h-6 w-6 text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{theme.name}</p>
                  <p className="text-xs text-slate-500">by {theme.author}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {(theme.rating / 20).toFixed(1)}
                    </span>
                    <span>v{theme.version}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Theme & Site Selection */}
        {selectedTheme && (
          <>
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-16 overflow-hidden rounded-lg bg-emerald-500/20">
                    {selectedTheme.screenshot_url ? (
                      <img
                        src={selectedTheme.screenshot_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{selectedTheme.name}</p>
                    <p className="text-sm text-slate-400">v{selectedTheme.version}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTheme(null)}
                  className="rounded-lg bg-white/10 px-3 py-1 text-sm text-slate-300 hover:bg-white/20"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Site Selection */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-white">Select Sites to Install On</h3>
                <button
                  onClick={selectAllSites}
                  className="text-sm text-wp-blue-400 hover:text-wp-blue-300"
                >
                  Select All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => toggleSite(site.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      selectedSites.has(site.id)
                        ? 'border-wp-blue-500 bg-wp-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border ${
                        selectedSites.has(site.id)
                          ? 'border-wp-blue-500 bg-wp-blue-500'
                          : 'border-white/30'
                      }`}
                    >
                      {selectedSites.has(site.id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{site.name}</p>
                      <p className="text-xs text-slate-500">
                        {site.url.replace(/^https?:\/\//, '')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Install Results */}
            {installResults.length > 0 && (
              <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <h4 className="mb-3 font-medium text-white">Installation Results</h4>
                <div className="space-y-2">
                  {installResults.map((result) => (
                    <div
                      key={result.siteId}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                        result.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <X className="h-4 w-4 text-red-400" />
                      )}
                      <span className={result.success ? 'text-emerald-300' : 'text-red-300'}>
                        {result.siteName}: {result.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Install Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl bg-white/5 px-5 py-3 font-medium text-slate-300 transition-colors hover:bg-white/10"
              >
                {installResults.length > 0 ? 'Done' : 'Cancel'}
              </button>
              {installResults.length === 0 && (
                <button
                  onClick={installTheme}
                  disabled={isInstalling || selectedSites.size === 0}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3 font-medium text-white transition-all hover:from-orange-400 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isInstalling ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Install on {selectedSites.size} Site{selectedSites.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ThemeCard({
  theme,
  isUpdating,
  onUpdate,
  onActivate,
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
    <div className="glass hover-lift group overflow-hidden rounded-2xl">
      {/* Theme preview */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
        {hasValidScreenshot ? (
          <img
            src={theme.screenshot}
            alt={theme.name}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <Palette className="h-12 w-12 text-slate-600" />
            <span className="text-sm font-medium text-slate-500">{theme.name}</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <button className="rounded-xl bg-white/20 p-3 text-white transition-colors hover:bg-white/30">
            <Eye className="h-5 w-5" />
          </button>
        </div>

        {/* Active badge */}
        {theme.status === 'active' && (
          <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
            Active
          </div>
        )}

        {/* Site badge */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
          {theme.siteName}
        </div>
      </div>

      {/* Theme info */}
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="mb-1 text-lg font-semibold text-white">{theme.name}</h3>
            <p className="font-mono text-sm text-slate-400">v{theme.version}</p>
          </div>
          {theme.hasUpdate && theme.latestVersion && (
            <span className="rounded-lg bg-orange-500/20 px-2 py-1 text-xs font-medium text-orange-400">
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-wp-blue-500 py-2 text-sm font-medium text-white transition-colors hover:bg-wp-blue-400 disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Update
                </>
              )}
            </button>
          ) : (
            <span className="flex flex-1 items-center justify-center gap-2 py-2 text-sm text-slate-500">
              <CheckCircle className="h-4 w-4" />
              Up to date
            </span>
          )}
          {theme.status !== 'active' && (
            <button
              onClick={onActivate}
              disabled={isUpdating}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
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
  color,
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
    <div className="glass flex items-center gap-4 rounded-xl p-4">
      <div className={`h-12 w-12 rounded-xl ${bgColors[color]} flex items-center justify-center`}>
        <Icon className="h-6 w-6" style={{ color: '#ffffff' }} />
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
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600">
        <Palette className="h-10 w-10" style={{ color: '#ffffff' }} />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">No themes to display</h3>
      <p className="text-slate-400">{message}</p>
    </div>
  )
}
