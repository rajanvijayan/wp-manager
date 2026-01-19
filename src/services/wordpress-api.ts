import axios, { AxiosInstance } from 'axios'
import { WordPressSite } from '@/store/sitesStore'

export interface PluginInfo {
  name: string
  slug: string
  version: string
  status: 'active' | 'inactive'
  updateAvailable: boolean
  latestVersion?: string
}

export interface ThemeInfo {
  name: string
  slug: string
  version: string
  status: 'active' | 'inactive'
  updateAvailable: boolean
  latestVersion?: string
  screenshot?: string
}

export interface SiteStatus {
  wp_version: string
  php_version: string
  plugin_count: number
  theme_count: number
  active_theme: string
  updates_available: {
    plugins: number
    themes: number
    core: boolean
  }
}

class WordPressAPIService {
  private createClient(site: WordPressSite): AxiosInstance {
    return axios.create({
      baseURL: `${site.url}/wp-json/wp-manager/v1`,
      timeout: 30000,
      headers: {
        'X-WP-Manager-Key': site.apiKey,
        'X-WP-Manager-Secret': site.apiSecret,
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Get site status and basic information
   */
  async getSiteStatus(site: WordPressSite): Promise<SiteStatus> {
    const client = this.createClient(site)
    const response = await client.get('/status')
    return response.data
  }

  /**
   * Get all plugins for a site
   */
  async getPlugins(site: WordPressSite): Promise<PluginInfo[]> {
    const client = this.createClient(site)
    const response = await client.get('/plugins')
    return response.data
  }

  /**
   * Update a plugin
   */
  async updatePlugin(site: WordPressSite, pluginSlug: string): Promise<boolean> {
    const client = this.createClient(site)
    const response = await client.post(`/plugins/${pluginSlug}/update`)
    return response.data.success
  }

  /**
   * Activate/deactivate a plugin
   */
  async togglePlugin(site: WordPressSite, pluginSlug: string, activate: boolean): Promise<boolean> {
    const client = this.createClient(site)
    const response = await client.post(
      `/plugins/${pluginSlug}/${activate ? 'activate' : 'deactivate'}`
    )
    return response.data.success
  }

  /**
   * Bulk update all plugins
   */
  async updateAllPlugins(site: WordPressSite): Promise<{ updated: string[]; failed: string[] }> {
    const client = this.createClient(site)
    const response = await client.post('/plugins/update-all')
    return response.data
  }

  /**
   * Get all themes for a site
   */
  async getThemes(site: WordPressSite): Promise<ThemeInfo[]> {
    const client = this.createClient(site)
    const response = await client.get('/themes')
    return response.data
  }

  /**
   * Update a theme
   */
  async updateTheme(site: WordPressSite, themeSlug: string): Promise<boolean> {
    const client = this.createClient(site)
    const response = await client.post(`/themes/${themeSlug}/update`)
    return response.data.success
  }

  /**
   * Activate a theme
   */
  async activateTheme(site: WordPressSite, themeSlug: string): Promise<boolean> {
    const client = this.createClient(site)
    const response = await client.post(`/themes/${themeSlug}/activate`)
    return response.data.success
  }

  /**
   * Bulk update all themes
   */
  async updateAllThemes(site: WordPressSite): Promise<{ updated: string[]; failed: string[] }> {
    const client = this.createClient(site)
    const response = await client.post('/themes/update-all')
    return response.data
  }

  /**
   * Test connection to a site
   */
  async testConnection(site: WordPressSite): Promise<boolean> {
    try {
      await this.getSiteStatus(site)
      return true
    } catch {
      return false
    }
  }
}

export const wordpressAPI = new WordPressAPIService()
