import { defineStore } from 'pinia'

const THEME_KEY = 'oxid:theme'
const AUTOLOCK_ENABLED_KEY = 'oxid:autolock-enabled'
const AUTOLOCK_SECONDS_KEY = 'oxid:autolock-seconds'

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
  }),
  actions: {
    init() {
      const savedTheme = localStorage.getItem(THEME_KEY)
      this.setTheme(savedTheme === 'light' ? 'light' : 'dark')

      const enabled = localStorage.getItem(AUTOLOCK_ENABLED_KEY)
      this.autoLockEnabled = enabled === null ? true : enabled === '1'

      const seconds = parseInt(localStorage.getItem(AUTOLOCK_SECONDS_KEY) || '120', 10)
      this.autoLockSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 120
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
  },
})
