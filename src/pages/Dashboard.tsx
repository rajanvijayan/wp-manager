import { 
  Globe, 
  Puzzle, 
  Palette, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  RefreshCw,
  TrendingUp
} from 'lucide-react'
import { useSitesStore } from '@/store/sitesStore'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const sites = useSitesStore((state) => state.sites)
  const navigate = useNavigate()

  const stats = {
    totalSites: sites.length,
    onlineSites: sites.filter((s) => s.status === 'online').length,
    offlineSites: sites.filter((s) => s.status === 'offline').length,
    pendingSites: sites.filter((s) => s.status === 'pending').length,
    totalPlugins: sites.reduce((acc, s) => acc + (s.pluginCount || 0), 0),
    totalThemes: sites.reduce((acc, s) => acc + (s.themeCount || 0), 0),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">
            Welcome back! Here's an overview of your WordPress sites.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh All
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 stagger-children">
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
          trend="3 updates available"
          color="purple"
        />
        <StatCard
          icon={Palette}
          label="Total Themes"
          value={stats.totalThemes}
          trend="All up to date"
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sites Overview */}
        <div className="col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Your Sites</h2>
            <button 
              onClick={() => navigate('/sites')}
              className="text-sm text-wp-blue-400 hover:text-wp-blue-300 flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-4 h-4" />
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
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
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
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
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
  color 
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
    <div className="glass rounded-2xl p-5 hover-lift">
      <div className={`w-12 h-12 rounded-xl ${bgColors[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" style={{ color: '#ffffff' }} />
      </div>
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <TrendingUp className="w-3 h-3" />
        {trend}
      </div>
    </div>
  )
}

function SiteRow({ site }: { site: any }) {
  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-red-500',
    pending: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
      <div className={`w-3 h-3 rounded-full ${statusColors[site.status]} animate-pulse`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{site.name}</p>
        <p className="text-sm text-slate-400 truncate">{site.url}</p>
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
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-wp-blue-500/20 to-wp-blue-600/10 flex items-center justify-center">
        <Globe className="w-8 h-8 text-wp-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No sites connected</h3>
      <p className="text-slate-400 mb-4">Get started by adding your first WordPress site</p>
      <button 
        onClick={() => navigate('/sites')}
        className="px-6 py-2 rounded-xl bg-wp-blue-500 text-white font-medium hover:bg-wp-blue-400 transition-colors"
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
  onClick 
}: { 
  icon: any
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-wp-blue-500 to-wp-blue-600 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" style={{ color: '#ffffff' }} />
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
  color 
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
      <Icon className={`w-4 h-4 mt-0.5 ${colors[color]}`} />
      <div>
        <p className="text-sm text-white">{text}</p>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {time}
        </p>
      </div>
    </div>
  )
}

