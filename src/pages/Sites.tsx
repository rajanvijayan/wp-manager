import { useState } from 'react'
import {
  Plus,
  Search,
  Globe,
  MoreVertical,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  User,
  Mail,
  Building2,
  Phone,
  ChevronDown,
  ChevronUp,
  FileText,
  Edit3,
} from 'lucide-react'
import { useSitesStore, WordPressSite, ClientInfo } from '@/store/sitesStore'

export default function Sites() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSite, setEditingSite] = useState<WordPressSite | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const sites = useSitesStore((state) => state.sites)
  const deleteSite = useSitesStore((state) => state.deleteSite)
  const refreshSiteStatus = useSitesStore((state) => state.refreshSiteStatus)

  const filteredSites = sites.filter(
    (site) =>
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Sites</h1>
          <p className="text-slate-400">Manage all your connected WordPress websites</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="hover-lift flex items-center gap-2 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:from-wp-blue-400 hover:to-wp-blue-500"
        >
          <Plus className="h-5 w-5" />
          Add Site
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search sites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-slate-400 transition-colors focus:border-wp-blue-500 focus:outline-none focus:ring-1 focus:ring-wp-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>{sites.length} total</span>
          <span>•</span>
          <span className="text-emerald-400">
            {sites.filter((s) => s.status === 'online').length} online
          </span>
        </div>
      </div>

      {/* Sites Grid */}
      {filteredSites.length === 0 ? (
        <EmptyState onAddClick={() => setShowAddModal(true)} hasSearch={searchQuery !== ''} />
      ) : (
        <div className="stagger-children grid grid-cols-2 gap-4">
          {filteredSites.map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onRefresh={() => refreshSiteStatus(site.id)}
              onDelete={() => deleteSite(site.id)}
              onEdit={() => setEditingSite(site)}
            />
          ))}
        </div>
      )}

      {/* Add Site Modal */}
      {showAddModal && <AddSiteModal onClose={() => setShowAddModal(false)} />}

      {/* Edit Site Modal */}
      {editingSite && <EditSiteModal site={editingSite} onClose={() => setEditingSite(null)} />}
    </div>
  )
}

function SiteCard({
  site,
  onRefresh,
  onDelete,
  onEdit,
}: {
  site: WordPressSite
  onRefresh: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const statusConfig: Record<
    string,
    { icon: typeof CheckCircle; color: string; bg: string; label: string }
  > = {
    online: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Online' },
    offline: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500', label: 'Offline' },
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500', label: 'Checking...' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500', label: 'Auth Error' },
    'no-plugin': {
      icon: AlertCircle,
      color: 'text-orange-400',
      bg: 'bg-orange-500',
      label: 'Plugin Required',
    },
  }

  const status = statusConfig[site.status] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <div className="glass hover-lift group relative rounded-2xl p-5">
      {/* Status indicator */}
      <div className={`absolute right-5 top-5 h-3 w-3 rounded-full ${status.bg} animate-pulse`} />

      {/* Site info */}
      <div className="mb-4 flex items-start gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-wp-blue-500/30 to-wp-blue-600/20">
          <Globe className="h-7 w-7 text-wp-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate pr-8 text-lg font-semibold text-white">{site.name}</h3>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 truncate text-sm text-slate-400 hover:text-wp-blue-400"
          >
            {site.url.replace(/^https?:\/\//, '')}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Client info */}
      {site.client && (
        <div className="mb-4 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
          <div className="mb-2 flex items-center gap-2">
            <User className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Client</span>
            {site.client.sendReports && (
              <span className="ml-auto rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
                📧 Reports Enabled
              </span>
            )}
          </div>
          <p className="text-sm text-white">{site.client.name}</p>
          <p className="text-xs text-slate-400">{site.client.email}</p>
          {site.client.company && <p className="text-xs text-slate-500">{site.client.company}</p>}
        </div>
      )}

      {/* Status & Stats */}
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${status.color}`}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{status.label}</span>
        </div>
        {site.lastSync && (
          <span className="text-xs text-slate-500">
            Last sync: {new Date(site.lastSync).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Plugin required notice */}
      {site.status === 'no-plugin' && (
        <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/10 p-3">
          <p className="text-xs text-orange-300">
            <strong>Plugin Required:</strong> Install the WP Manager Connector plugin on this site
            to enable full management.
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="mb-4 flex items-center gap-4 rounded-xl bg-white/5 px-4 py-3">
        <div className="flex-1 text-center">
          <p className="text-lg font-semibold text-white">{site.pluginCount || 0}</p>
          <p className="text-xs text-slate-400">Plugins</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex-1 text-center">
          <p className="text-lg font-semibold text-white">{site.themeCount || 0}</p>
          <p className="text-xs text-slate-400">Themes</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="flex-1 text-center">
          <p className="text-lg font-semibold text-white">{site.wpVersion || '—'}</p>
          <p className="text-xs text-slate-400">WP Version</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Sync
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10"
          title="Edit Site"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="glass absolute bottom-full right-0 z-20 mb-2 w-48 rounded-xl border border-white/10 py-2">
                <button
                  onClick={() => {
                    window.open(site.url + '/wp-admin', '_blank')
                    setShowMenu(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open WP Admin
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Site
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onAddClick, hasSearch }: { onAddClick: () => void; hasSearch: boolean }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-wp-blue-500/20 to-wp-blue-600/10">
        <Globe className="h-10 w-10 text-wp-blue-400" />
      </div>
      {hasSearch ? (
        <>
          <h3 className="mb-2 text-xl font-semibold text-white">No sites found</h3>
          <p className="text-slate-400">Try adjusting your search query</p>
        </>
      ) : (
        <>
          <h3 className="mb-2 text-xl font-semibold text-white">No sites connected yet</h3>
          <p className="mb-6 text-slate-400">
            Connect your first WordPress site to start managing it from here
          </p>
          <button
            onClick={onAddClick}
            className="rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 px-6 py-3 font-medium text-white transition-all hover:from-wp-blue-400 hover:to-wp-blue-500"
          >
            Add Your First Site
          </button>
        </>
      )}
    </div>
  )
}

function AddSiteModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showClientSection, setShowClientSection] = useState(false)

  // Client fields
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [sendReports, setSendReports] = useState(false)

  const addSite = useSitesStore((state) => state.addSite)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const siteData: any = {
        name,
        url: url.replace(/\/+$/, ''),
        apiKey,
        apiSecret,
      }

      // Add client info if provided
      if (clientName && clientEmail) {
        siteData.client = {
          name: clientName,
          email: clientEmail,
          company: clientCompany || undefined,
          phone: clientPhone || undefined,
          sendReports,
          reportDay: 1, // Default to 1st of month
        }
      }

      await addSite(siteData)
      onClose()
    } catch (error) {
      console.error('Failed to add site:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="glass relative mx-4 max-h-[90vh] w-full max-w-lg animate-slide-up overflow-y-auto rounded-2xl p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 text-2xl font-bold text-white">Add New Site</h2>
        <p className="mb-6 text-slate-400">Enter your WordPress site details to connect it</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Site Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My WordPress Site"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-wp-blue-500 focus:outline-none focus:ring-1 focus:ring-wp-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Site URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-wp-blue-500 focus:outline-none focus:ring-1 focus:ring-wp-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 transition-colors focus:border-wp-blue-500 focus:outline-none focus:ring-1 focus:ring-wp-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">API Secret</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your API secret"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 font-mono text-sm text-white placeholder-slate-500 transition-colors focus:border-wp-blue-500 focus:outline-none focus:ring-1 focus:ring-wp-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-white/10"
              >
                {showSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Client Information Section */}
          <div className="overflow-hidden rounded-xl border border-purple-500/30">
            <button
              type="button"
              onClick={() => setShowClientSection(!showClientSection)}
              className="flex w-full items-center justify-between bg-purple-500/10 p-4 transition-colors hover:bg-purple-500/20"
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-purple-400" />
                <span className="font-medium text-purple-300">Client Information</span>
                <span className="text-xs text-slate-500">(Optional)</span>
              </div>
              {showClientSection ? (
                <ChevronUp className="h-5 w-5 text-purple-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-purple-400" />
              )}
            </button>

            {showClientSection && (
              <div className="space-y-4 bg-purple-500/5 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      <User className="mr-1 inline h-4 w-4" />
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      <Mail className="mr-1 inline h-4 w-4" />
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      <Building2 className="mr-1 inline h-4 w-4" />
                      Company
                    </label>
                    <input
                      type="text"
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      placeholder="Company Name"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      <Phone className="mr-1 inline h-4 w-4" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+1 234 567 890"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={sendReports}
                    onChange={(e) => setSendReports(e.target.checked)}
                    className="h-5 w-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Enable Monthly Reports</p>
                    <p className="text-xs text-slate-400">
                      Send monthly site reports to this client via email
                    </p>
                  </div>
                  <FileText className="ml-auto h-5 w-5 text-purple-400" />
                </label>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-wp-blue-500/20 bg-wp-blue-500/10 p-4">
            <p className="text-sm text-wp-blue-300">
              <strong>Note:</strong> You'll need to install the WP Manager plugin on your WordPress
              site to get the API credentials.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-slate-300 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 py-3 font-medium text-white transition-all hover:from-wp-blue-400 hover:to-wp-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Add Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Site Modal
function EditSiteModal({ site, onClose }: { site: WordPressSite; onClose: () => void }) {
  const [name, setName] = useState(site.name)
  const [isLoading, setIsLoading] = useState(false)

  // Client fields
  const [clientName, setClientName] = useState(site.client?.name || '')
  const [clientEmail, setClientEmail] = useState(site.client?.email || '')
  const [clientCompany, setClientCompany] = useState(site.client?.company || '')
  const [clientPhone, setClientPhone] = useState(site.client?.phone || '')
  const [sendReports, setSendReports] = useState(site.client?.sendReports || false)

  const updateSite = useSitesStore((state) => state.updateSite)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updates: Partial<WordPressSite> = {
        name,
      }

      // Update client info
      if (clientName && clientEmail) {
        updates.client = {
          name: clientName,
          email: clientEmail,
          company: clientCompany || undefined,
          phone: clientPhone || undefined,
          sendReports,
          reportDay: site.client?.reportDay || 1,
          lastReportSent: site.client?.lastReportSent,
        }
      } else {
        updates.client = undefined
      }

      await updateSite(site.id, updates)
      onClose()
    } catch (error) {
      console.error('Failed to update site:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="glass relative mx-4 max-h-[90vh] w-full max-w-lg animate-slide-up overflow-y-auto rounded-2xl p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-2 text-2xl font-bold text-white">Edit Site</h2>
        <p className="mb-6 text-slate-400">Update site and client information</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Site Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My WordPress Site"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-wp-blue-500 focus:outline-none focus:ring-1 focus:ring-wp-blue-500"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-sm text-slate-400">
              <Globe className="mr-1 inline h-4 w-4" />
              {site.url}
            </p>
          </div>

          {/* Client Information Section */}
          <div className="overflow-hidden rounded-xl border border-purple-500/30">
            <div className="bg-purple-500/10 p-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-purple-400" />
                <span className="font-medium text-purple-300">Client Information</span>
              </div>
            </div>

            <div className="space-y-4 bg-purple-500/5 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    <User className="mr-1 inline h-4 w-4" />
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    <Mail className="mr-1 inline h-4 w-4" />
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    <Building2 className="mr-1 inline h-4 w-4" />
                    Company
                  </label>
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Company Name"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    <Phone className="mr-1 inline h-4 w-4" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={sendReports}
                  onChange={(e) => setSendReports(e.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                />
                <div>
                  <p className="text-sm font-medium text-white">Enable Monthly Reports</p>
                  <p className="text-xs text-slate-400">
                    Send monthly site reports to this client via email
                  </p>
                </div>
                <FileText className="ml-auto h-5 w-5 text-purple-400" />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-slate-300 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 py-3 font-medium text-white transition-all hover:from-wp-blue-400 hover:to-wp-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
