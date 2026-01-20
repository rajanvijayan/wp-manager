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
  Mail,
  Eye,
  X,
  Save,
  RotateCcw,
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
  emailTemplate?: EmailTemplate
}

interface EmailTemplate {
  subject: string
  body: string
}

const defaultEmailTemplate: EmailTemplate = {
  subject: '[Monthly Report] {{site_name}} - {{month}} {{year}}',
  body: `Dear {{client_name}},

I hope this email finds you well. Please find below your website's monthly maintenance and performance report for {{month}} {{year}}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEBSITE OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Website:        {{site_name}}
URL:            {{site_url}}
Status:         {{site_status}}
Last Monitored: {{last_sync}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECHNICAL SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WordPress Version:  {{wp_version}}
PHP Version:        {{php_version}}
Active Theme:       {{active_theme}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAINTENANCE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PLUGINS
• Total Installed:    {{plugin_count}}
• Updates Applied:    {{plugins_updated}}
• Status:             ✓ All plugins are up to date

THEMES
• Total Installed:    {{theme_count}}
• Updates Applied:    {{themes_updated}}
• Status:             ✓ All themes are up to date

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Published Posts:     {{total_posts}}
Published Pages:     {{total_pages}}
Approved Comments:   {{total_comments}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STORAGE & DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Database Size:       {{db_size}}
Media Library:       {{file_count}} files
Uploads Folder:      {{uploads_size}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIONS COMPLETED THIS MONTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Security monitoring and uptime checks
✓ Plugin updates and compatibility verification
✓ Theme updates and testing
✓ Database optimization
✓ Backup verification
✓ Performance monitoring

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your website is performing well and all systems are operating normally. If you have any questions about this report or would like to discuss your website further, please don't hesitate to reach out.

Thank you for your continued trust in our services.

Best regards,

{{company_name}}
Website Management Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This report was automatically generated on {{report_date}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
}

const defaultSettings: AppSettings = {
  darkMode: true,
  autoSync: true,
  syncInterval: '30',
  notifications: true,
  updateAlerts: true,
  siteDownAlerts: true,
  emailTemplate: defaultEmailTemplate,
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

      {/* Email Template */}
      <EmailTemplateSection
        template={settings.emailTemplate || defaultEmailTemplate}
        onSave={(template) => updateSetting('emailTemplate', template)}
        onReset={() => updateSetting('emailTemplate', defaultEmailTemplate)}
      />

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

function EmailTemplateSection({
  template,
  onSave,
  onReset,
}: {
  template: EmailTemplate
  onSave: (template: EmailTemplate) => void
  onReset: () => void
}) {
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  const [showPreview, setShowPreview] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setSubject(template.subject)
    setBody(template.body)
  }, [template])

  useEffect(() => {
    setHasChanges(subject !== template.subject || body !== template.body)
  }, [subject, body, template])

  const handleSave = () => {
    onSave({ subject, body })
    setHasChanges(false)
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to the default template?')) {
      onReset()
    }
  }

  // Sample data for preview
  const sampleData: Record<string, string> = {
    client_name: 'John Smith',
    site_name: 'Example Website',
    site_url: 'https://example.com',
    month: 'January',
    year: '2026',
    wp_version: '6.4.2',
    php_version: '8.2',
    active_theme: 'Flavor starter theme flavor starter theme',
    plugin_count: '12',
    plugins_updated: '3',
    theme_count: '2',
    themes_updated: '1',
    total_posts: '45',
    total_pages: '12',
    total_comments: '128',
    db_size: '25.5 MB',
    file_count: '1,234',
    uploads_size: '150.2 MB',
    site_status: '✅ Online',
    last_sync: 'January 20, 2026 at 10:30 AM',
    report_date: 'January 20, 2026',
    company_name: 'Your Agency Name',
  }

  const replaceVariables = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleData[key] || `{{${key}}}`)
  }

  const availableVariables = [
    { key: 'client_name', label: 'Client Name' },
    { key: 'site_name', label: 'Site Name' },
    { key: 'site_url', label: 'Site URL' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
    { key: 'wp_version', label: 'WordPress Version' },
    { key: 'php_version', label: 'PHP Version' },
    { key: 'active_theme', label: 'Active Theme' },
    { key: 'plugin_count', label: 'Plugin Count' },
    { key: 'plugins_updated', label: 'Plugins Updated' },
    { key: 'theme_count', label: 'Theme Count' },
    { key: 'themes_updated', label: 'Themes Updated' },
    { key: 'total_posts', label: 'Total Posts' },
    { key: 'total_pages', label: 'Total Pages' },
    { key: 'total_comments', label: 'Total Comments' },
    { key: 'db_size', label: 'Database Size' },
    { key: 'file_count', label: 'File Count' },
    { key: 'uploads_size', label: 'Uploads Size' },
    { key: 'site_status', label: 'Site Status' },
    { key: 'last_sync', label: 'Last Sync' },
    { key: 'report_date', label: 'Report Date' },
    { key: 'company_name', label: 'Company Name' },
  ]

  return (
    <>
      <div className="glass rounded-2xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <Mail className="h-5 w-5" style={{ color: '#ffffff' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Email Template</h2>
              <p className="text-sm text-slate-400">
                Customize monthly report emails sent to clients
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 rounded-lg bg-wp-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-wp-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Subject */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-colors focus:border-wp-blue-500 focus:outline-none"
              placeholder="Monthly Website Report - {{site_name}}"
            />
          </div>

          {/* Body */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-slate-500 transition-colors focus:border-wp-blue-500 focus:outline-none"
              placeholder="Enter your email template..."
            />
          </div>

          {/* Available Variables */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Available Variables (click to copy)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableVariables.map((v) => (
                <button
                  key={v.key}
                  onClick={() => {
                    navigator.clipboard.writeText(`{{${v.key}}}`)
                  }}
                  className="rounded-lg bg-white/5 px-2 py-1 font-mono text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                  title={v.label}
                >
                  {`{{${v.key}}}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          />

          <div className="relative mx-4 max-h-[90vh] w-full max-w-3xl animate-slide-up overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-600" />
                <span className="font-semibold text-slate-900">Email Preview</span>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Email Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="w-16 font-medium text-slate-500">To:</span>
                  <span className="text-slate-900">
                    {sampleData.client_name} &lt;client@example.com&gt;
                  </span>
                </div>
                <div className="flex">
                  <span className="w-16 font-medium text-slate-500">Subject:</span>
                  <span className="text-slate-900">{replaceVariables(subject)}</span>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="max-h-[60vh] overflow-y-auto bg-white px-6 py-6">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-800">
                {replaceVariables(body)}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-300"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
