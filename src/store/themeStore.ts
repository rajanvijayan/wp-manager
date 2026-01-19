import { create } from 'zustand'

interface ThemeState {
  darkMode: boolean
  loadTheme: () => Promise<void>
  setDarkMode: (value: boolean) => Promise<void>
}

export const useThemeStore = create<ThemeState>((set) => ({
  darkMode: true,

  loadTheme: async () => {
    try {
      if (window.electronAPI?.getSettings) {
        const settings = await window.electronAPI.getSettings()
        set({ darkMode: settings.darkMode !== false }) // Default to dark mode
      }
    } catch (error) {
      console.error('Failed to load theme:', error)
    }
  },

  setDarkMode: async (value: boolean) => {
    set({ darkMode: value })
    try {
      if (window.electronAPI?.saveSetting) {
        await window.electronAPI.saveSetting('darkMode', value)
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  },
}))
