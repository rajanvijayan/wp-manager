import { useState, useEffect } from 'react'
import {
  Globe,
  Puzzle,
  Palette,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import { useSitesStore } from '@/store/sitesStore'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const sites = useSitesStore((state) => state.sites)
  const navigate = useNavigate()
  const [pluginUpdates, setPluginUpdates] = useState(0)
  const [themeUpdates, setThemeUpdates] = useState(0)

  // Fetch actual update counts from sites
  useEffect(() => {
    const fetchUpdates = async () => {
      if (!window.electronAPI) return

      let pluginUpdatesCount = 0
      let themeUpdatesCount = 0

      const onlineSites = sites.filter((s) => s.status === 'online')

      for (const site of onlineSites) {
        try {
          // Fetch plugins
          const pluginResult = await (window as any).electronAPI.fetchFromSite({
            url: `${site.url}/wp-json/wp-manager/v1/plugins`,
            apiKey: site.apiKey,
            apiSecret: site.apiSecret,
          })
          if (pluginResult.ok && Array.isArray(pluginResult.data)) {
            pluginUpdatesCount += pluginResult.data.filter((p: any) => p.updateAvailable).length
          }

          // Fetch themes
          const themeResult = await (window as any).electronAPI.fetchFromSite({
            url: `${site.url}/wp-json/wp-manager/v1/themes`,
            apiKey: site.apiKey,
            apiSecret: site.apiSecret,
          })
          if (themeResult.ok && Array.isArray(themeResult.data)) {
            themeUpdatesCount += themeResult.data.filter((t: any) => t.updateAvailable).length
          }
        } catch (error) {
          console.error(`Failed to fetch updates from ${site.name}:`, error)
        }
      }

      setPluginUpdates(pluginUpdatesCount)
      setThemeUpdates(themeUpdatesCount)
    }

    fetchUpdates()
  }, [sites])

  const stats = {
    totalSites: sites.length,
    onlineSites: sites.filter((s) => s.status === 'online').length,
    offlineSites: sites.filter((s) => s.status === 'offline').length,
    pendingSites: sites.filter((s) => s.status === 'pending').length,
    totalPlugins: sites.reduce((acc, s) => acc + (s.pluginCount || 0), 0),
    totalThemes: sites.reduce((acc, s) => acc + (s.themeCount || 0), 0),
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">
            Welcome back! Here's an overview of your WordPress sites.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-slate-300 transition-colors hover:bg-white/10">
          <RefreshCw className="h-4 w-4" />
          Refresh All
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stagger-children grid grid-cols-4 gap-4">
        <StatCard
          icon={Globe}
          label="Total Sites"
          value={stats.totalSites}
          trend="+2 this month"
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Online"
          value={stats.onlineSites}
          trend="100% uptime"
          color="green"
        />
        <StatCard
          icon={Puzzle}
          label="Total Plugins"
          value={stats.totalPlugins}
          trend={
            pluginUpdates > 0
              ? `${pluginUpdates} update${pluginUpdates !== 1 ? 's' : ''} available`
              : 'All up to date'
          }
          color="purple"
        />
        <StatCard
          icon={Palette}
          label="Total Themes"
          value={stats.totalThemes}
          trend={
            themeUpdates > 0
              ? `${themeUpdates} update${themeUpdates !== 1 ? 's' : ''} available`
              : 'All up to date'
          }
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sites Overview */}
        <div className="glass col-span-2 rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Your Sites</h2>
            <button
              onClick={() => navigate('/sites')}
              className="flex items-center gap-1 text-sm text-wp-blue-400 hover:text-wp-blue-300"
            >
              View all <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {sites.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {sites.slice(0, 5).map((site) => (
                <SiteRow key={site.id} site={site} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Quick Actions</h2>
            <div className="space-y-3">
              <QuickAction
                icon={Globe}
                label="Add New Site"
                description="Connect a WordPress site"
                onClick={() => navigate('/sites')}
              />
              <QuickAction
                icon={Puzzle}
                label="Update Plugins"
                description="Check for updates"
                onClick={() => navigate('/plugins')}
              />
              <QuickAction
                icon={RefreshCw}
                label="Sync All Sites"
                description="Refresh all connections"
                onClick={() => {}}
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Recent Activity</h2>
            <div className="space-y-4">
              <ActivityItem
                icon={CheckCircle}
                text="Site connected successfully"
                time="2 hours ago"
                color="green"
              />
              <ActivityItem
                icon={Puzzle}
                text="3 plugins updated"
                time="5 hours ago"
                color="blue"
              />
              <ActivityItem
                icon={AlertTriangle}
                text="Connection timeout"
                time="1 day ago"
                color="yellow"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: any
  label: string
  value: number
  trend: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const bgColors = {
    blue: 'bg-gradient-to-br from-wp-blue-500 to-wp-blue-600',
    green: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    purple: 'bg-gradient-to-br from-violet-500 to-violet-600',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
  }

  return (
    <div className="glass hover-lift rounded-2xl p-5">
      <div
        className={`h-12 w-12 rounded-xl ${bgColors[color]} mb-4 flex items-center justify-center`}
      >
        <Icon className="h-6 w-6" style={{ color: '#ffffff' }} />
      </div>
      <p className="mb-1 text-sm text-slate-400">{label}</p>
      <p className="mb-2 text-3xl font-bold text-white">{value}</p>
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <TrendingUp className="h-3 w-3" />
        {trend}
      </div>
    </div>
  )
}

function SiteRow({ site }: { site: any }) {
  const statusColors: Record<string, string> = {
    online: 'bg-emerald-500',
    offline: 'bg-red-500',
    pending: 'bg-yellow-500',
    error: 'bg-red-500',
    'no-plugin': 'bg-orange-500',
  }

  return (
    <div className="flex cursor-pointer items-center gap-4 rounded-xl bg-white/5 p-4 transition-colors hover:bg-white/10">
      <div
        className={`h-3 w-3 rounded-full ${statusColors[site.status] || 'bg-gray-500'} animate-pulse`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">{site.name}</p>
        <p className="truncate text-sm text-slate-400">{site.url}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-slate-400">{site.pluginCount || 0} plugins</p>
        <p className="text-xs text-slate-500">WP {site.wpVersion || 'Unknown'}</p>
      </div>
    </div>
  )
}

function EmptyState() {
  const navigate = useNavigate()

  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-wp-blue-500/20 to-wp-blue-600/10">
        <Globe className="h-8 w-8 text-wp-blue-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">No sites connected</h3>
      <p className="mb-4 text-slate-400">Get started by adding your first WordPress site</p>
      <button
        onClick={() => navigate('/sites')}
        className="rounded-xl bg-wp-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-wp-blue-400"
      >
        Add Your First Site
      </button>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: any
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-wp-blue-500 to-wp-blue-600">
        <Icon className="h-5 w-5" style={{ color: '#ffffff' }} />
      </div>
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </button>
  )
}

function ActivityItem({
  icon: Icon,
  text,
  time,
  color,
}: {
  icon: any
  text: string
  time: string
  color: 'green' | 'blue' | 'yellow'
}) {
  const colors = {
    green: 'text-emerald-400',
    blue: 'text-wp-blue-400',
    yellow: 'text-yellow-400',
  }

  return (
    <div className="flex items-start gap-3">
      <Icon className={`mt-0.5 h-4 w-4 ${colors[color]}`} />
      <div>
        <p className="text-sm text-white">{text}</p>
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          {time}
        </p>
      </div>
    </div>
  )
}
