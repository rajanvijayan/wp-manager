import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Globe, Puzzle, Palette, Settings, Plus, Zap } from 'lucide-react'
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
    <aside className="flex w-64 flex-col border-r border-white/5 bg-slate-925/50">
      {/* Sites summary */}
      <div className="border-b border-white/5 p-4">
        <div className="glass-light rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Connected Sites
            </span>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-400" />
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
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'border-glow bg-wp-blue-500/20 text-wp-blue-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              } `}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-wp-blue-400' : ''}`} />
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-wp-blue-400" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Quick add button */}
      <div className="border-t border-white/5 p-4">
        <NavLink
          to="/sites"
          className="hover-lift flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-wp-blue-500 to-wp-blue-600 py-3 font-medium text-white transition-all duration-200 hover:from-wp-blue-400 hover:to-wp-blue-500"
        >
          <Plus className="h-5 w-5" />
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
