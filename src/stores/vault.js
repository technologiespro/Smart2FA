import { defineStore } from 'pinia'
import { encryptJSON, decryptJSON } from '../lib/crypto'
import { useAuthStore, STORAGE_KEYS } from './auth'

function uid() {
  return 'tk_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export const useVaultStore = defineStore('vault', {
  state: () => ({
    tokens: [],
    loaded: false,
  }),
  getters: {
    byCategory: (state) => (cat) => state.tokens.filter(t => t.category === cat),
    filtered: (state) => (query) => {
      const q = (query || '').trim().toLowerCase()
      if (!q) return state.tokens
      return state.tokens.filter(t =>
        (t.issuer || '').toLowerCase().includes(q) ||
        (t.label || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      )
    },
  },
  actions: {
    load() {
      const auth = useAuthStore()
      if (!auth.pin) return
      const raw = localStorage.getItem(STORAGE_KEYS.vault)
      if (!raw) {
        this.tokens = []
        this.loaded = true
        return
      }
      try {
        const data = decryptJSON(raw, auth.pin)
        this.tokens = Array.isArray(data) ? data : []
      } catch (e) {
        this.tokens = []
      }
      this.loaded = true
    },
    persist() {
      const auth = useAuthStore()
      if (!auth.pin) return
      const enc = encryptJSON(this.tokens, auth.pin)
      localStorage.setItem(STORAGE_KEYS.vault, enc)
    },
    findDuplicate(t) {
      const norm = (s) => String(s || '').trim().toLowerCase()
      const secret = String(t.secret || '').replace(/\s+/g, '').toUpperCase()
      return this.tokens.find(x =>
        String(x.secret || '').replace(/\s+/g, '').toUpperCase() === secret &&
        norm(x.issuer) === norm(t.issuer) &&
        norm(x.label) === norm(t.label)
      ) || null
    },
    addToken(t, { allowDuplicate = false } = {}) {
      const dup = this.findDuplicate(t)
      if (dup && !allowDuplicate) {
        return { token: dup, isDuplicate: true }
      }
      const token = {
        id: uid(),
        issuer: t.issuer || '',
        label: t.label || '',
        secret: t.secret,
        algorithm: t.algorithm || 'SHA1',
        digits: t.digits || 6,
        period: t.period || 30,
        category: t.category || 'other',
        createdAt: Date.now(),
      }
      this.tokens.unshift(token)
      this.persist()
      return { token, isDuplicate: false }
    },
    updateToken(id, patch) {
      const idx = this.tokens.findIndex(t => t.id === id)
      if (idx === -1) return
      this.tokens[idx] = { ...this.tokens[idx], ...patch }
      this.persist()
    },
    removeToken(id) {
      this.tokens = this.tokens.filter(t => t.id !== id)
      this.persist()
    },
    exportEncrypted() {
      const auth = useAuthStore()
      if (!auth.pin) return null
      return encryptJSON({ version: 1, tokens: this.tokens, exportedAt: Date.now() }, auth.pin)
    },
    importEncrypted(payload, pinOverride = null) {
      const auth = useAuthStore()
      const pin = pinOverride || auth.pin
      const data = decryptJSON(payload, pin)
      const incoming = Array.isArray(data) ? data : data.tokens
      if (!Array.isArray(incoming)) throw new Error('Invalid export format')
      // Merge while avoiding exact duplicates by secret+issuer+label
      const key = (t) => `${t.secret}|${t.issuer}|${t.label}`
      const existing = new Set(this.tokens.map(key))
      for (const t of incoming) {
        if (!existing.has(key(t))) {
          this.tokens.push({ ...t, id: t.id || uid() })
        }
      }
      this.persist()
      return incoming.length
    },
    clearAll() {
      this.tokens = []
      this.persist()
    },
  },
})
