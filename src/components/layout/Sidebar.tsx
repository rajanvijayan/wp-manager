import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Globe, 
  Puzzle, 
  Palette, 
  Settings,
  Plus,
  Zap
} from 'lucide-react'
import { useSitesStore } from '@/store/sitesStore'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/sites', icon: Globe, label: 'Sites' },
  { path: '/plugins', icon: Puzzle, label: 'Plugins' },
  { path: '/themes', icon: Palette, label: 'Themes' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const sites = useSitesStore((state) => state.sites)
  const onlineSites = sites.filter((s) => s.status === 'online').length

  return (
    <aside className="w-64 bg-slate-925/50 border-r border-white/5 flex flex-col">
      {/* Sites summary */}
      <div className="p-4 border-b border-white/5">
        <div className="glass-light rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Connected Sites
            </span>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">{onlineSites} online</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{sites.length}</span>
            <span className="text-sm text-slate-500">total</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-wp-blue-500/20 text-wp-blue-400 border-glow' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-wp-blue-400' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-wp-blue-400 animate-pulse" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Quick add button */}
      <div className="p-4 border-t border-white/5">
        <NavLink
          to="/sites"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 text-white font-medium hover:from-wp-blue-400 hover:to-wp-blue-500 transition-all duration-200 hover-lift"
        >
          <Plus className="w-5 h-5" />
          Add New Site
        </NavLink>
      </div>

      {/* Version info */}
      <div className="p-4 pt-0">
        <div className="text-center">
          <span className="text-xs text-slate-600">WP Manager v1.0.0</span>
        </div>
      </div>
    </aside>
  )
}

