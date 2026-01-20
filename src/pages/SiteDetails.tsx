import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Globe,
  Users,
  Database,
  FolderOpen,
  FileText,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  LogIn,
  Shield,
  User,
  Mail,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  HardDrive,
} from 'lucide-react'
import { useSitesStore } from '@/store/sitesStore'

interface SiteUser {
  id: number
  username: string
  email: string
  display_name: string
  roles: string[]
  registered: string
}

interface SiteStats {
  file_count: number
  db_size: string
  db_size_bytes: number
  uploads_size: string
  uploads_size_bytes: number
  total_posts: number
  total_pages: number
  total_comments: number
}

export default function SiteDetails() {
  const { siteId } = useParams<{ siteId: string }>()
  const navigate = useNavigate()
  const sites = useSitesStore((state) => state.sites)
  const site = sites.find((s) => s.id === siteId)

  const [users, setUsers] = useState<SiteUser[]>([])
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (site && site.status === 'online') {
      fetchUsers()
      fetchStats()
    }
  }, [site])

  const fetchUsers = async () => {
    if (!site) return
    setIsLoadingUsers(true)
    try {
      const result = await window.electronAPI.getSiteUsers({
        siteUrl: site.url,
        apiKey: site.apiKey,
        apiSecret: site.apiSecret,
      })
      if (result.ok) {
        setUsers(result.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const fetchStats = async () => {
    if (!site) return
    setIsLoadingStats(true)
    try {
      const result = await window.electronAPI.getSiteStats({
        siteUrl: site.url,
        apiKey: site.apiKey,
        apiSecret: site.apiSecret,
      })
      if (result.ok && result.stats) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleAdminLogin = async () => {
    if (!site) return
    setIsLoggingIn(true)
    try {
      const result = await window.electronAPI.getAdminLoginUrl({
        siteUrl: site.url,
        apiKey: site.apiKey,
        apiSecret: site.apiSecret,
      })
      if (result.ok && result.loginUrl) {
        await window.electronAPI.openExternalUrl(result.loginUrl)
      } else {
        // Fallback to regular wp-admin URL
        await window.electronAPI.openExternalUrl(`${site.url}/wp-admin`)
      }
    } catch (error) {
      console.error('Failed to get login URL:', error)
      await window.electronAPI.openExternalUrl(`${site.url}/wp-admin`)
    } finally {
      setIsLoggingIn(false)
    }
  }

  if (!site) {
    return (
      <div className="flex animate-fade-in items-center justify-center p-12">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-semibold text-white">Site not found</h2>
          <button
            onClick={() => navigate('/sites')}
            className="text-wp-blue-400 hover:text-wp-blue-300"
          >
            Go back to Sites
          </button>
        </div>
      </div>
    )
  }

  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
    online: { icon: CheckCircle, color: 'text-emerald-400', label: 'Online' },
    offline: { icon: XCircle, color: 'text-red-400', label: 'Offline' },
    pending: { icon: RefreshCw, color: 'text-yellow-400', label: 'Checking...' },
    error: { icon: AlertCircle, color: 'text-red-400', label: 'Auth Error' },
    'no-plugin': { icon: AlertCircle, color: 'text-orange-400', label: 'Plugin Required' },
  }

  const status = statusConfig[site.status] || statusConfig.pending
  const StatusIcon = status.icon

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'bg-red-500/20 text-red-400'
      case 'editor':
        return 'bg-blue-500/20 text-blue-400'
      case 'author':
        return 'bg-green-500/20 text-green-400'
      case 'contributor':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'subscriber':
        return 'bg-slate-500/20 text-slate-400'
      default:
        return 'bg-purple-500/20 text-purple-400'
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sites')}
          className="rounded-lg bg-white/5 p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{site.name}</h1>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-wp-blue-400"
          >
            {site.url.replace(/^https?:\/\//, '')}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className={`flex items-center gap-2 ${status.color}`}>
          <StatusIcon className="h-5 w-5" />
          <span className="font-medium">{status.label}</span>
        </div>
        <button
          onClick={handleAdminLogin}
          disabled={isLoggingIn || site.status !== 'online'}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 px-5 py-2.5 font-medium text-white transition-all hover:from-wp-blue-400 hover:to-wp-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoggingIn ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogIn className="h-5 w-5" />
          )}
          Admin Login
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Database}
          label="Database Size"
          value={stats?.db_size || '—'}
          isLoading={isLoadingStats}
          color="blue"
        />
        <StatCard
          icon={FolderOpen}
          label="File Count"
          value={stats?.file_count?.toLocaleString() || '—'}
          isLoading={isLoadingStats}
          color="purple"
        />
        <StatCard
          icon={HardDrive}
          label="Uploads Size"
          value={stats?.uploads_size || '—'}
          isLoading={isLoadingStats}
          color="green"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={users.length.toString()}
          isLoading={isLoadingUsers}
          color="orange"
        />
      </div>

      {/* Content Stats */}
      {stats && (
        <div className="glass rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Content Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-wp-blue-400" />
              <p className="text-2xl font-bold text-white">{stats.total_posts}</p>
              <p className="text-sm text-slate-400">Posts</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <Globe className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
              <p className="text-2xl font-bold text-white">{stats.total_pages}</p>
              <p className="text-sm text-slate-400">Pages</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-violet-400" />
              <p className="text-2xl font-bold text-white">{stats.total_comments}</p>
              <p className="text-sm text-slate-400">Comments</p>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Users & Roles</h2>
          <button
            onClick={fetchUsers}
            disabled={isLoadingUsers}
            className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {site.status !== 'online' ? (
          <div className="rounded-xl bg-orange-500/10 p-4 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-orange-400" />
            <p className="text-sm text-orange-300">
              Site must be online to view users. Please check your connection.
            </p>
          </div>
        ) : isLoadingUsers ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-wp-blue-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl bg-white/5 p-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-slate-500" />
            <p className="text-slate-400">No users found or endpoint not available</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Roles</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="transition-colors hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-wp-blue-500/30 to-wp-blue-600/20">
                          <User className="h-5 w-5 text-wp-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.display_name}</p>
                          <p className="text-xs text-slate-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Mail className="h-4 w-4 text-slate-500" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(role)}`}
                          >
                            <Shield className="h-3 w-3" />
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="h-4 w-4" />
                        {user.registered ? new Date(user.registered).toLocaleDateString() : '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  isLoading,
  color,
}: {
  icon: any
  label: string
  value: string
  isLoading: boolean
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
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColors[color]}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        ) : (
          <p className="text-2xl font-bold text-white">{value}</p>
        )}
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  )
}
