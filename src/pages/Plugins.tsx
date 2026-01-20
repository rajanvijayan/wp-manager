import { useState, useEffect } from 'react'
import {
  Puzzle,
  Search,
  RefreshCw,
  Download,
  CheckCircle,
  AlertTriangle,
  Globe,
  ArrowUpCircle,
  Loader2,
  Plus,
  X,
  Star,
  Users,
  Check,
} from 'lucide-react'
import { useSitesStore } from '@/store/sitesStore'

interface PluginInfo {
  name: string
  slug: string
  version: string
  status: 'active' | 'inactive'
  hasUpdate: boolean
  latestVersion?: string
  siteId: string
  siteName: string
}

interface WpOrgPlugin {
  name: string
  slug: string
  version: string
  author: string
  rating: number
  active_installs: number
  short_description: string
  icons?: Record<string, string>
}

export default function Plugins() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [updatingPlugins, setUpdatingPlugins] = useState<Set<string>>(new Set())
  const [showInstallModal, setShowInstallModal] = useState(false)
  const sites = useSitesStore((state) => state.sites)

  const onlineSites = sites.filter((s) => s.status === 'online')

  // Fetch plugins from sites
  const fetchPlugins = async () => {
    if (onlineSites.length === 0) {
      setPlugins([])
      return
    }

    setIsLoading(true)
    const allPlugins: PluginInfo[] = []

    for (const site of onlineSites) {
      if (selectedSite !== 'all' && site.id !== selectedSite) continue

      try {
        if (window.electronAPI) {
          // Use main process to fetch (no CORS)
          const result = await (window as any).electronAPI.fetchFromSite({
            url: `${site.url}/wp-json/wp-manager/v1/plugins`,
            apiKey: site.apiKey,
            apiSecret: site.apiSecret,
          })

          if (result.ok && Array.isArray(result.data)) {
            result.data.forEach((plugin: any) => {
              allPlugins.push({
                ...plugin,
                hasUpdate: plugin.updateAvailable || false,
                siteId: site.id,
                siteName: site.name,
              })
            })
          }
        }
      } catch (error) {
        console.error(`Failed to fetch plugins from ${site.name}:`, error)
      }
    }

    setPlugins(allPlugins)
    setIsLoading(false)
  }

  useEffect(() => {
    if (onlineSites.length > 0) {
      fetchPlugins()
    }
  }, [selectedSite, sites])

  const filteredPlugins = plugins.filter((plugin) =>
    plugin.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const updatesAvailable = plugins.filter((p) => p.hasUpdate).length

  // Update a single plugin
  const updatePlugin = async (plugin: PluginInfo) => {
    const key = `${plugin.siteId}-${plugin.slug}`
    setUpdatingPlugins((prev) => new Set(prev).add(key))

    try {
      const site = sites.find((s) => s.id === plugin.siteId)
      if (!site) return

      const result = await (window as any).electronAPI.fetchFromSite({
        url: `${site.url}/wp-json/wp-manager/v1/plugins/${plugin.slug}/update`,
        method: 'POST',
        apiKey: site.apiKey,
        apiSecret: site.apiSecret,
      })

      if (result.ok) {
        // Refresh plugins list
        await fetchPlugins()
      } else {
        alert(`Failed to update ${plugin.name}`)
      }
    } catch (error) {
      console.error('Update failed:', error)
      alert(`Failed to update ${plugin.name}`)
    } finally {
      setUpdatingPlugins((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // Update all plugins
  const updateAllPlugins = async () => {
    const pluginsToUpdate = plugins.filter((p) => p.hasUpdate)
    for (const plugin of pluginsToUpdate) {
      await updatePlugin(plugin)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Plugins</h1>
          <p className="text-slate-400">Manage plugins across all your WordPress sites</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 font-medium text-white transition-all hover:from-emerald-400 hover:to-emerald-500"
          >
            <Plus className="h-5 w-5" />
            Install New
          </button>
          <button
            onClick={fetchPlugins}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {updatesAvailable > 0 && (
            <button
              onClick={updateAllPlugins}
              className="hover-lift flex items-center gap-2 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 px-5 py-2.5 font-medium text-white transition-all hover:from-wp-blue-400 hover:to-wp-blue-500"
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
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-400 transition-colors focus:border-wp-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Puzzle} label="Total Plugins" value={plugins.length} color="blue" />
        <StatCard
          icon={CheckCircle}
          label="Active"
          value={plugins.filter((p) => p.status === 'active').length}
          color="green"
        />
        <StatCard
          icon={ArrowUpCircle}
          label="Updates Available"
          value={updatesAvailable}
          color="orange"
        />
        <StatCard icon={Globe} label="Connected Sites" value={onlineSites.length} color="purple" />
      </div>

      {/* Plugins List */}
      {onlineSites.length === 0 ? (
        <EmptyState message="Connect a WordPress site with the WP Manager plugin to see plugins" />
      ) : isLoading ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-wp-blue-400" />
          <p className="text-slate-400">Loading plugins...</p>
        </div>
      ) : plugins.length === 0 ? (
        <EmptyState message="No plugins found. Make sure the WP Manager plugin is installed on your sites." />
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Plugin</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Site</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Version</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPlugins.map((plugin, index) => {
                const key = `${plugin.siteId}-${plugin.slug}`
                const isUpdating = updatingPlugins.has(key)

                return (
                  <tr key={`${key}-${index}`} className="transition-colors hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/30 to-violet-600/20">
                          <Puzzle className="h-5 w-5 text-violet-400" />
                        </div>
                        <span className="font-medium text-white">{plugin.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-300">{plugin.siteName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-300">v{plugin.version}</span>
                      {plugin.hasUpdate && plugin.latestVersion && (
                        <span className="ml-2 font-mono text-sm text-emerald-400">
                          → v{plugin.latestVersion}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {plugin.hasUpdate ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-400">
                          <AlertTriangle className="h-3 w-3" />
                          Update Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          Up to Date
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {plugin.hasUpdate ? (
                        <button
                          onClick={() => updatePlugin(plugin)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-2 rounded-lg bg-wp-blue-500/20 px-4 py-1.5 text-sm font-medium text-wp-blue-400 transition-colors hover:bg-wp-blue-500/30 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            'Update'
                          )}
                        </button>
                      ) : (
                        <span className="text-sm text-slate-500">No action needed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Install Plugin Modal */}
      {showInstallModal && (
        <InstallPluginModal
          sites={onlineSites}
          onClose={() => setShowInstallModal(false)}
          onInstalled={fetchPlugins}
        />
      )}
    </div>
  )
}

function InstallPluginModal({
  sites,
  onClose,
  onInstalled,
}: {
  sites: any[]
  onClose: () => void
  onInstalled: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<WpOrgPlugin[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set())
  const [selectedPlugin, setSelectedPlugin] = useState<WpOrgPlugin | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installResults, setInstallResults] = useState<
    { siteId: string; siteName: string; success: boolean; message?: string }[]
  >([])

  const searchPlugins = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const result = await window.electronAPI.searchWpPlugins(searchQuery)
      if (result.ok) {
        setSearchResults(result.plugins)
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

  const installPlugin = async () => {
    if (!selectedPlugin || selectedSites.size === 0) return

    setIsInstalling(true)
    const results: { siteId: string; siteName: string; success: boolean; message?: string }[] = []

    for (const siteId of selectedSites) {
      const site = sites.find((s) => s.id === siteId)
      if (!site) continue

      try {
        const result = await window.electronAPI.installPlugin({
          siteUrl: site.url,
          apiKey: site.apiKey,
          apiSecret: site.apiSecret,
          pluginSlug: selectedPlugin.slug,
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

        <h2 className="mb-2 text-2xl font-bold text-white">Install New Plugin</h2>
        <p className="mb-6 text-slate-400">
          Search WordPress.org and install plugins on multiple sites at once
        </p>

        {/* Search */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search WordPress plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchPlugins()}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-400 transition-colors focus:border-wp-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={searchPlugins}
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
        {searchResults.length > 0 && !selectedPlugin && (
          <div className="mb-6 max-h-[300px] overflow-y-auto rounded-xl border border-white/10">
            {searchResults.map((plugin) => (
              <button
                key={plugin.slug}
                onClick={() => setSelectedPlugin(plugin)}
                className="flex w-full items-center gap-4 border-b border-white/5 p-4 text-left transition-colors hover:bg-white/5"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
                  {plugin.icons?.['1x'] ? (
                    <img
                      src={plugin.icons['1x']}
                      alt=""
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <Puzzle className="h-6 w-6 text-violet-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{plugin.name}</p>
                  <p className="truncate text-sm text-slate-400">{plugin.short_description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {(plugin.rating / 20).toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {plugin.active_installs?.toLocaleString()}+ active
                    </span>
                    <span>v{plugin.version}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Plugin & Site Selection */}
        {selectedPlugin && (
          <>
            <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{selectedPlugin.name}</p>
                    <p className="text-sm text-slate-400">v{selectedPlugin.version}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlugin(null)}
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
                  onClick={installPlugin}
                  disabled={isInstalling || selectedSites.size === 0}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3 font-medium text-white transition-all hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
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
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10">
        <Puzzle className="h-10 w-10 text-violet-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">No plugins to display</h3>
      <p className="text-slate-400">{message}</p>
    </div>
  )
}
