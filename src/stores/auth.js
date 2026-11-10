import { defineStore } from 'pinia'
import { hashPin } from '../lib/crypto'
import {
  registerBiometric,
  unlockWithBiometric,
  removeBiometric,
  hasRegisteredBiometric,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
} from '../lib/webauthn'

const KEYS = {
  pinHash: 'oxid:pin-hash',
  vault: 'oxid:vault',
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    unlocked: false,
    pin: null, // held in-memory only; never persisted
    hasPin: false,
    biometricRegistered: false,
    biometricSupported: false,
    platformAuthAvailable: false,
  }),
  actions: {
    async init() {
      this.hasPin = !!localStorage.getItem(KEYS.pinHash)
      this.biometricRegistered = hasRegisteredBiometric()
      this.biometricSupported = isWebAuthnSupported()
      this.platformAuthAvailable = await isPlatformAuthenticatorAvailable()
    },
    async createPin(pin) {
      const h = await hashPin(pin)
      localStorage.setItem(KEYS.pinHash, h)
      this.pin = pin
      this.unlocked = true
      this.hasPin = true
    },
    async verifyPin(pin) {
      const stored = localStorage.getItem(KEYS.pinHash)
      if (!stored) return false
      const h = await hashPin(pin)
      if (h === stored) {
        this.pin = pin
        this.unlocked = true
        return true
      }
      return false
    },
    async enableBiometric(pin) {
      // pin must currently be unlocked + correct
      if (!pin) throw new Error('PIN required')
      await registerBiometric(pin)
      this.biometricRegistered = true
    },
    disableBiometric() {
      removeBiometric()
      this.biometricRegistered = false
    },
    async unlockWithBiometric() {
      const pin = await unlockWithBiometric()
      const ok = await this.verifyPin(pin)
      if (!ok) {
        // PIN changed underneath; clean up stale biometric registration
        removeBiometric()
        this.biometricRegistered = false
        throw new Error('Biometric data is stale. Re-enable it from Settings.')
      }
      return true
    },
    lock() {
      this.unlocked = false
      this.pin = null
    },
    wipe() {
      localStorage.removeItem(KEYS.pinHash)
      localStorage.removeItem(KEYS.vault)
      removeBiometric()
      this.unlocked = false
      this.pin = null
      this.hasPin = false
      this.biometricRegistered = false
    },
  },
})

export const STORAGE_KEYS = KEYS
