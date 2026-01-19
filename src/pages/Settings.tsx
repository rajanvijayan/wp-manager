import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Info,
  ExternalLink,
  Check,
  Loader2,
} from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import AppIcon from '@/components/AppIcon'
import { UpdateNotification } from '@/components/UpdateNotification'

interface AppSettings {
  darkMode: boolean
  autoSync: boolean
  syncInterval: string
  notifications: boolean
  updateAlerts: boolean
  siteDownAlerts: boolean
}

const defaultSettings: AppSettings = {
  darkMode: true,
  autoSync: true,
  syncInterval: '30',
  notifications: true,
  updateAlerts: true,
  siteDownAlerts: true,
}

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const { darkMode, setDarkMode } = useThemeStore()

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.electronAPI?.getSettings) {
          const saved = await window.electronAPI.getSettings()
          setSettings({ ...defaultSettings, ...saved })
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Save a single setting
  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    setIsSaving(true)
    setSaveMessage('')

    // Special handling for dark mode - update the theme store
    if (key === 'darkMode') {
      await setDarkMode(value)
    }

    try {
      if (window.electronAPI?.saveSettings) {
        await window.electronAPI.saveSettings(newSettings)
        setSaveMessage('Settings saved!')
        setTimeout(() => setSaveMessage(''), 2000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveMessage('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  // Sync dark mode state with theme store
  useEffect(() => {
    setSettings((prev) => ({ ...prev, darkMode }))
  }, [darkMode])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-wp-blue-400" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Configure your WP Manager preferences</p>
        </div>
        {(isSaving || saveMessage) && (
          <div className="flex items-center gap-2 text-sm">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-wp-blue-400" />
                <span className="text-slate-400">Saving...</span>
              </>
            ) : (
              saveMessage && (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">{saveMessage}</span>
                </>
              )
            )}
          </div>
        )}
      </div>

      {/* General Settings */}
      <SettingsSection icon={SettingsIcon} title="General">
        <SettingRow label="Dark Mode" description="Use dark theme for the application">
          <Toggle checked={settings.darkMode} onChange={(v) => updateSetting('darkMode', v)} />
        </SettingRow>
        <SettingRow label="Auto Sync" description="Automatically sync sites on startup">
          <Toggle checked={settings.autoSync} onChange={(v) => updateSetting('autoSync', v)} />
        </SettingRow>
        <SettingRow label="Sync Interval" description="How often to check for updates (in minutes)">
          <select
            value={settings.syncInterval}
            onChange={(e) => updateSetting('syncInterval', e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white transition-colors focus:border-wp-blue-500 focus:outline-none"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </SettingRow>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={Bell} title="Notifications">
        <SettingRow
          label="Enable Notifications"
          description="Get notified about updates and site status changes"
        >
          <Toggle
            checked={settings.notifications}
            onChange={(v) => updateSetting('notifications', v)}
          />
        </SettingRow>
        <SettingRow
          label="Update Alerts"
          description="Notify when plugin or theme updates are available"
        >
          <Toggle
            checked={settings.updateAlerts}
            onChange={(v) => updateSetting('updateAlerts', v)}
          />
        </SettingRow>
        <SettingRow label="Site Down Alerts" description="Notify when a site goes offline">
          <Toggle
            checked={settings.siteDownAlerts}
            onChange={(v) => updateSetting('siteDownAlerts', v)}
          />
        </SettingRow>
      </SettingsSection>

      {/* Security */}
      <SettingsSection icon={Shield} title="Security">
        <SettingRow label="Secure Storage" description="API credentials are encrypted locally">
          <span className="flex items-center gap-2 text-sm text-emerald-400">
            <Check className="h-4 w-4" />
            Enabled
          </span>
        </SettingRow>
        <SettingRow label="Clear All Data" description="Remove all stored sites and credentials">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                // TODO: Implement clear data
                alert('This feature will be implemented soon.')
              }
            }}
            className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
          >
            Clear Data
          </button>
        </SettingRow>
      </SettingsSection>

      {/* Data */}
      <SettingsSection icon={Database} title="Data">
        <SettingRow label="Export Data" description="Export your sites configuration">
          <button className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10">
            Export JSON
          </button>
        </SettingRow>
        <SettingRow label="Import Data" description="Import sites from a backup file">
          <button className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10">
            Import
          </button>
        </SettingRow>
      </SettingsSection>

      {/* Software Updates */}
      <UpdateNotification />

      {/* About */}
      <SettingsSection icon={Info} title="About">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">WP Manager</p>
              <p className="text-sm text-slate-400">
                Manage all your WordPress websites from one powerful desktop application.
              </p>
            </div>
            <AppIcon size={48} />
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/username/wp-manager"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-wp-blue-400 hover:text-wp-blue-300"
            >
              Documentation <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://github.com/username/wp-manager/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-wp-blue-400 hover:text-wp-blue-300"
            >
              Report Issue <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: any
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-wp-blue-500 to-wp-blue-600">
          <Icon className="h-5 w-5" style={{ color: '#ffffff' }} />
        </div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-12 rounded-full transition-colors ${checked ? 'bg-wp-blue-500' : 'bg-slate-700'} `}
    >
      <div
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'left-7' : 'left-1'} `}
      />
    </button>
  )
}
