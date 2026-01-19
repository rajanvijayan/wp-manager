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
  Edit3
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sites</h1>
          <p className="text-slate-400">
            Manage all your connected WordPress websites
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 text-white font-medium hover:from-wp-blue-400 hover:to-wp-blue-500 transition-all duration-200 hover-lift"
        >
          <Plus className="w-5 h-5" />
          Add Site
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search sites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-wp-blue-500 focus:ring-1 focus:ring-wp-blue-500 transition-colors"
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
        <div className="grid grid-cols-2 gap-4 stagger-children">
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
      {editingSite && (
        <EditSiteModal 
          site={editingSite} 
          onClose={() => setEditingSite(null)} 
        />
      )}
    </div>
  )
}

function SiteCard({ 
  site, 
  onRefresh, 
  onDelete,
  onEdit
}: { 
  site: WordPressSite
  onRefresh: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
    online: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500', label: 'Online' },
    offline: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500', label: 'Offline' },
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500', label: 'Checking...' },
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500', label: 'Auth Error' },
    'no-plugin': { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500', label: 'Plugin Required' },
  }

  const status = statusConfig[site.status] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <div className="glass rounded-2xl p-5 hover-lift relative group">
      {/* Status indicator */}
      <div className={`absolute top-5 right-5 w-3 h-3 rounded-full ${status.bg} animate-pulse`} />
      
      {/* Site info */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-wp-blue-500/30 to-wp-blue-600/20 flex items-center justify-center flex-shrink-0">
          <Globe className="w-7 h-7 text-wp-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate pr-8">{site.name}</h3>
          <a 
            href={site.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-slate-400 hover:text-wp-blue-400 flex items-center gap-1 truncate"
          >
            {site.url.replace(/^https?:\/\//, '')}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
      </div>

      {/* Client info */}
      {site.client && (
        <div className="mb-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Client</span>
            {site.client.sendReports && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                📧 Reports Enabled
              </span>
            )}
          </div>
          <p className="text-sm text-white">{site.client.name}</p>
          <p className="text-xs text-slate-400">{site.client.email}</p>
          {site.client.company && (
            <p className="text-xs text-slate-500">{site.client.company}</p>
          )}
        </div>
      )}

      {/* Status & Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 ${status.color}`}>
          <StatusIcon className="w-4 h-4" />
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
        <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <p className="text-xs text-orange-300">
            <strong>Plugin Required:</strong> Install the WP Manager Connector plugin on this site to enable full management.
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-4 py-3 px-4 rounded-xl bg-white/5">
        <div className="flex-1 text-center">
          <p className="text-lg font-semibold text-white">{site.pluginCount || 0}</p>
          <p className="text-xs text-slate-400">Plugins</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex-1 text-center">
          <p className="text-lg font-semibold text-white">{site.themeCount || 0}</p>
          <p className="text-xs text-slate-400">Themes</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex-1 text-center">
          <p className="text-lg font-semibold text-white">{site.wpVersion || '—'}</p>
          <p className="text-xs text-slate-400">WP Version</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Sync
        </button>
        <button
          onClick={onEdit}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          title="Edit Site"
        >
          <Edit3 className="w-5 h-5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 bottom-full mb-2 w-48 rounded-xl glass border border-white/10 py-2 z-20">
                <button
                  onClick={() => {
                    window.open(site.url + '/wp-admin', '_blank')
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open WP Admin
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                >
                  <Trash2 className="w-4 h-4" />
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
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-wp-blue-500/20 to-wp-blue-600/10 flex items-center justify-center">
        <Globe className="w-10 h-10 text-wp-blue-400" />
      </div>
      {hasSearch ? (
        <>
          <h3 className="text-xl font-semibold text-white mb-2">No sites found</h3>
          <p className="text-slate-400">Try adjusting your search query</p>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold text-white mb-2">No sites connected yet</h3>
          <p className="text-slate-400 mb-6">
            Connect your first WordPress site to start managing it from here
          </p>
          <button
            onClick={onAddClick}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 text-white font-medium hover:from-wp-blue-400 hover:to-wp-blue-500 transition-all"
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
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg glass rounded-2xl p-6 animate-slide-up mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">Add New Site</h2>
        <p className="text-slate-400 mb-6">
          Enter your WordPress site details to connect it
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My WordPress Site"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-wp-blue-500 focus:ring-1 focus:ring-wp-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Site URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-wp-blue-500 focus:ring-1 focus:ring-wp-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-wp-blue-500 focus:ring-1 focus:ring-wp-blue-500 transition-colors font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              API Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your API secret"
                required
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-wp-blue-500 focus:ring-1 focus:ring-wp-blue-500 transition-colors font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 text-slate-400"
              >
                {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Client Information Section */}
          <div className="border border-purple-500/30 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowClientSection(!showClientSection)}
              className="w-full flex items-center justify-between p-4 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-purple-300">Client Information</span>
                <span className="text-xs text-slate-500">(Optional)</span>
              </div>
              {showClientSection ? (
                <ChevronUp className="w-5 h-5 text-purple-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-purple-400" />
              )}
            </button>
            
            {showClientSection && (
              <div className="p-4 space-y-4 bg-purple-500/5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Client Email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Company
                    </label>
                    <input
                      type="text"
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      placeholder="Company Name"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+1 234 567 890"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                </div>
                
                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={sendReports}
                    onChange={(e) => setSendReports(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Enable Monthly Reports</p>
                    <p className="text-xs text-slate-400">Send monthly site reports to this client via email</p>
                  </div>
                  <FileText className="w-5 h-5 text-purple-400 ml-auto" />
                </label>
              </div>
            )}
          </div>

          <div className="bg-wp-blue-500/10 rounded-xl p-4 border border-wp-blue-500/20">
            <p className="text-sm text-wp-blue-300">
              <strong>Note:</strong> You'll need to install the WP Manager plugin on your WordPress site to get the API credentials.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 text-white font-medium hover:from-wp-blue-400 hover:to-wp-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg glass rounded-2xl p-6 animate-slide-up mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">Edit Site</h2>
        <p className="text-slate-400 mb-6">
          Update site and client information
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Site Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My WordPress Site"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-wp-blue-500 focus:ring-1 focus:ring-wp-blue-500 transition-colors"
            />
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-slate-400">
              <Globe className="w-4 h-4 inline mr-1" />
              {site.url}
            </p>
          </div>

          {/* Client Information Section */}
          <div className="border border-purple-500/30 rounded-xl overflow-hidden">
            <div className="p-4 bg-purple-500/10">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-400" />
                <span className="font-medium text-purple-300">Client Information</span>
              </div>
            </div>
            
            <div className="p-4 space-y-4 bg-purple-500/5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Company
                  </label>
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="Company Name"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
              </div>
              
              <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={sendReports}
                  onChange={(e) => setSendReports(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                />
                <div>
                  <p className="text-sm font-medium text-white">Enable Monthly Reports</p>
                  <p className="text-xs text-slate-400">Send monthly site reports to this client via email</p>
                </div>
                <FileText className="w-5 h-5 text-purple-400 ml-auto" />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 text-white font-medium hover:from-wp-blue-400 hover:to-wp-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

