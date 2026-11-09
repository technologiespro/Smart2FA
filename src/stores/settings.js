import { defineStore } from 'pinia'
import { Capacitor } from '@capacitor/core'

const THEME_KEY = 'oxid:theme'
const AUTOLOCK_ENABLED_KEY = 'oxid:autolock-enabled'
const AUTOLOCK_SECONDS_KEY = 'oxid:autolock-seconds'
const MINIMIZE_TO_TRAY_KEY = 'oxid:minimize-to-tray'

export const AUTO_LOCK_OPTIONS = [
  { value: 30,    label: '30 sec' },
  { value: 60,    label: '1 min' },
  { value: 120,   label: '2 min' },
  { value: 300,   label: '5 min' },
  { value: 600,   label: '10 min' },
  { value: 1800,  label: '30 min' },
]

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    theme: 'dark',
    autoLockEnabled: true,
    autoLockSeconds: 120,
    minimizeToTray: false,
    isDesktop: false,
  }),
  actions: {
    init() {
      const platform = Capacitor.getPlatform()
      this.isDesktop = platform !== 'android' && platform !== 'ios'

      const savedTheme = localStorage.getItem(THEME_KEY)
      this.setTheme(savedTheme === 'light' ? 'light' : 'dark')

      const enabled = localStorage.getItem(AUTOLOCK_ENABLED_KEY)
      this.autoLockEnabled = enabled === null ? true : enabled === '1'

      const seconds = parseInt(localStorage.getItem(AUTOLOCK_SECONDS_KEY) || '120', 10)
      this.autoLockSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 120

      const savedMinToTray = localStorage.getItem(MINIMIZE_TO_TRAY_KEY)
      this.minimizeToTray = savedMinToTray === '1'
      this.syncMinimizeToTray()
    },
    syncMinimizeToTray() {
      if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__?.invoke) {
        try {
          window.__TAURI_INTERNALS__.invoke('set_minimize_to_tray', { enabled: this.minimizeToTray })
        } catch (e) {
          console.warn('Failed to sync minimizeToTray with Tauri:', e)
        }
      }
    },
    setTheme(theme) {
      this.theme = theme
      const root = document.documentElement
      if (theme === 'light') {
        root.classList.add('light')
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      } else {
        root.classList.add('dark')
        root.classList.remove('light')
        root.style.colorScheme = 'dark'
      }
      localStorage.setItem(THEME_KEY, theme)
    },
    toggleTheme() {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark')
    },
    setAutoLockEnabled(enabled) {
      this.autoLockEnabled = !!enabled
      localStorage.setItem(AUTOLOCK_ENABLED_KEY, enabled ? '1' : '0')
    },
    setAutoLockSeconds(seconds) {
      const v = parseInt(seconds, 10)
      if (!Number.isFinite(v) || v <= 0) return
      this.autoLockSeconds = v
      localStorage.setItem(AUTOLOCK_SECONDS_KEY, String(v))
    },
    setMinimizeToTray(enabled) {
      this.minimizeToTray = !!enabled
      localStorage.setItem(MINIMIZE_TO_TRAY_KEY, enabled ? '1' : '0')
      this.syncMinimizeToTray()
    },
  },
})
