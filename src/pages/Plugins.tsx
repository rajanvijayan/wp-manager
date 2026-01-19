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
  Loader2
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

export default function Plugins() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [plugins, setPlugins] = useState<PluginInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [updatingPlugins, setUpdatingPlugins] = useState<Set<string>>(new Set())
  const sites = useSitesStore((state) => state.sites)
  
  const onlineSites = sites.filter(s => s.status === 'online')

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

  const filteredPlugins = plugins.filter(
    (plugin) => plugin.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const updatesAvailable = plugins.filter((p) => p.hasUpdate).length

  // Update a single plugin
  const updatePlugin = async (plugin: PluginInfo) => {
    const key = `${plugin.siteId}-${plugin.slug}`
    setUpdatingPlugins(prev => new Set(prev).add(key))
    
    try {
      const site = sites.find(s => s.id === plugin.siteId)
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
      setUpdatingPlugins(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  // Update all plugins
  const updateAllPlugins = async () => {
    const pluginsToUpdate = plugins.filter(p => p.hasUpdate)
    for (const plugin of pluginsToUpdate) {
      await updatePlugin(plugin)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Plugins</h1>
          <p className="text-slate-400">
            Manage plugins across all your WordPress sites
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchPlugins}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {updatesAvailable > 0 && (
            <button 
              onClick={updateAllPlugins}
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
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-wp-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Puzzle} label="Total Plugins" value={plugins.length} color="blue" />
        <StatCard icon={CheckCircle} label="Active" value={plugins.filter(p => p.status === 'active').length} color="green" />
        <StatCard icon={ArrowUpCircle} label="Updates Available" value={updatesAvailable} color="orange" />
        <StatCard icon={Globe} label="Connected Sites" value={onlineSites.length} color="purple" />
      </div>

      {/* Plugins List */}
      {onlineSites.length === 0 ? (
        <EmptyState message="Connect a WordPress site with the WP Manager plugin to see plugins" />
      ) : isLoading ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Loader2 className="w-10 h-10 text-wp-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading plugins...</p>
        </div>
      ) : plugins.length === 0 ? (
        <EmptyState message="No plugins found. Make sure the WP Manager plugin is installed on your sites." />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Plugin</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Site</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Version</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPlugins.map((plugin, index) => {
                const key = `${plugin.siteId}-${plugin.slug}`
                const isUpdating = updatingPlugins.has(key)
                
                return (
                  <tr key={`${key}-${index}`} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/30 to-violet-600/20 flex items-center justify-center">
                          <Puzzle className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className="font-medium text-white">{plugin.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-300 text-sm">{plugin.siteName}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-300 font-mono text-sm">v{plugin.version}</span>
                      {plugin.hasUpdate && plugin.latestVersion && (
                        <span className="text-emerald-400 font-mono text-sm ml-2">→ v{plugin.latestVersion}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {plugin.hasUpdate ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Update Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Up to Date
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {plugin.hasUpdate ? (
                        <button 
                          onClick={() => updatePlugin(plugin)}
                          disabled={isUpdating}
                          className="px-4 py-1.5 rounded-lg bg-wp-blue-500/20 text-wp-blue-400 text-sm font-medium hover:bg-wp-blue-500/30 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            'Update'
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-500 text-sm">No action needed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
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
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center">
        <Puzzle className="w-10 h-10 text-violet-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No plugins to display</h3>
      <p className="text-slate-400">{message}</p>
    </div>
  )
}
