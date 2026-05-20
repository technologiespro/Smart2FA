<template>
  <div class="min-h-screen flex flex-col px-6 pt-11 pb-10" data-testid="settings-screen">
    <div class="mb-5">
      <button class="label flex items-center gap-1 text-zinc-400 hover:text-rust transition-colors" @click="$router.back()" data-testid="back-button">
        ← Back
      </button>
      <div class="label mt-4">SYSTEM</div>
      <h1 class="font-mono font-black text-2xl tracking-tighter">Settings</h1>
    </div>

    <div class="flex flex-col gap-3">
      <!-- Auto-Lock -->
      <div class="metallic rounded-lg p-4" data-testid="autolock-row">
        <div class="flex items-center justify-between gap-3 mb-3">
          <div class="min-w-0 flex-1">
            <div class="font-mono font-bold tracking-tight flex items-center gap-2">
              AUTO-LOCK
              <span v-if="settings.autoLockEnabled" class="text-[9px] px-1.5 py-0.5 rounded bg-rust text-charcoal tracking-widest">ON</span>
            </div>
            <div class="text-xs text-zinc-400 mt-0.5">
              Lock automatically after inactivity.
            </div>
          </div>
          <!-- Toggle -->
          <button
            type="button"
            role="switch"
            :aria-checked="settings.autoLockEnabled"
            class="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
            :class="settings.autoLockEnabled ? 'bg-rust' : 'bg-zinc-700'"
            @click="settings.setAutoLockEnabled(!settings.autoLockEnabled)"
            data-testid="autolock-toggle"
          >
            <span
              class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              :class="settings.autoLockEnabled ? 'translate-x-5' : 'translate-x-0'"
            ></span>
          </button>
        </div>

        <div v-if="settings.autoLockEnabled" class="grid grid-cols-3 gap-2" data-testid="autolock-options">
          <button
            v-for="opt in autoLockOptions"
            :key="opt.value"
            type="button"
            class="metallic px-2 py-2 rounded-md text-[10px] uppercase tracking-[0.16em] font-semibold transition-all"
            :class="settings.autoLockSeconds === opt.value ? 'border-rust text-rust' : 'text-zinc-400'"
            @click="settings.setAutoLockSeconds(opt.value)"
            :data-testid="`autolock-${opt.value}`"
          >{{ opt.label }}</button>
        </div>
      </div>

      <!-- Biometric Unlock -->
      <div
        v-if="auth.biometricSupported && auth.platformAuthAvailable"
        class="metallic rounded-lg p-4 flex items-center justify-between gap-3"
        data-testid="biometric-row"
      >
        <div class="min-w-0 flex-1">
          <div class="font-mono font-bold tracking-tight flex items-center gap-2">
            BIOMETRIC UNLOCK
            <span v-if="auth.biometricRegistered" class="text-[9px] px-1.5 py-0.5 rounded bg-rust text-charcoal tracking-widest">ACTIVE</span>
          </div>
          <div class="text-xs text-zinc-400 mt-0.5">
            {{ auth.biometricRegistered
                ? 'Touch ID / Face ID / Windows Hello enabled.'
                : 'Unlock with Touch ID, Face ID, or Windows Hello.' }}
          </div>
        </div>
        <button
          v-if="!auth.biometricRegistered"
          type="button"
          class="btn-rust px-3 py-2 text-xs"
          :disabled="bioBusy"
          :class="{ 'opacity-50': bioBusy }"
          @click="enableBio"
          data-testid="biometric-enable"
        >{{ bioBusy ? 'Working…' : 'Enable' }}</button>
        <button
          v-else
          type="button"
          class="btn-ghost px-3 py-2 text-xs"
          @click="disableBio"
          data-testid="biometric-disable"
        >Disable</button>
      </div>
      <div
        v-else-if="auth.biometricSupported"
        class="metallic rounded-lg p-3 text-xs text-zinc-500"
        data-testid="biometric-unavailable"
      >
        Biometric unlock unavailable: no platform authenticator detected on this device.
      </div>

      <!-- Theme -->
      <div class="metallic rounded-lg p-4 flex items-center justify-between" data-testid="theme-row">
        <div>
          <div class="font-mono font-bold tracking-tight">APPEARANCE</div>
          <div class="text-xs text-zinc-400 mt-0.5">Dark charcoal · Steel light</div>
        </div>
        <div class="flex bg-black/30 rounded-md p-1 metallic" style="padding: 4px">
          <button
            v-for="t in ['dark', 'light']"
            :key="t"
            type="button"
            class="px-3 py-1.5 rounded-[6px] text-xs uppercase tracking-widest font-semibold transition-colors"
            :class="settings.theme === t ? 'bg-rust text-charcoal' : 'text-zinc-400 hover:text-zinc-200'"
            @click="settings.setTheme(t)"
            :data-testid="`theme-${t}`"
          >{{ t }}</button>
        </div>
      </div>

      <!-- Export -->
      <button type="button" class="metallic rounded-lg p-4 text-left flex items-center justify-between hover:border-rust/60 transition-colors" @click="doExport" data-testid="export-button">
        <div>
          <div class="font-mono font-bold tracking-tight">EXPORT VAULT</div>
          <div class="text-xs text-zinc-400 mt-0.5">Download encrypted backup (.oxid)</div>
        </div>
        <span class="text-rust text-xl">›</span>
      </button>

      <!-- Import -->
      <label class="metallic rounded-lg p-4 cursor-pointer flex items-center justify-between hover:border-rust/60 transition-colors" data-testid="import-row">
        <div>
          <div class="font-mono font-bold tracking-tight">IMPORT VAULT</div>
          <div class="text-xs text-zinc-400 mt-0.5">Restore from a .oxid backup file</div>
        </div>
        <span class="text-rust text-xl">›</span>
        <input type="file" accept=".oxid,.json,.txt,application/json" class="hidden" @change="onImportFile" data-testid="import-input" />
      </label>

      <!-- Import from Google Authenticator -->
      <button
        type="button"
        class="metallic rounded-lg p-4 text-left flex items-center justify-between hover:border-rust/60 transition-colors"
        @click="$router.push({ name: 'scan', query: { source: 'google' } })"
        data-testid="import-google-button"
      >
        <div class="min-w-0">
          <div class="font-mono font-bold tracking-tight">IMPORT FROM GOOGLE AUTH</div>
          <div class="text-xs text-zinc-400 mt-0.5">Scan the "Transfer accounts" QR — batch import all tokens.</div>
        </div>
        <span class="text-rust text-xl flex-shrink-0 ml-2">›</span>
      </button>

      <!-- Lock -->
      <button type="button" class="metallic rounded-lg p-4 text-left flex items-center justify-between hover:border-rust/60 transition-colors" @click="lock" data-testid="lock-row">
        <div>
          <div class="font-mono font-bold tracking-tight">LOCK NOW</div>
          <div class="text-xs text-zinc-400 mt-0.5">Return to PIN entry</div>
        </div>
        <span class="text-rust text-xl">›</span>
      </button>

      <!-- Wipe -->
      <button type="button" class="metallic rounded-lg p-4 text-left flex items-center justify-between transition-colors" style="border-color: rgba(220,38,38,0.4)" @click="showWipe = true" data-testid="wipe-button">
        <div>
          <div class="font-mono font-bold tracking-tight text-red-500">WIPE ALL DATA</div>
          <div class="text-xs text-zinc-400 mt-0.5">Destroy vault, PIN, and settings</div>
        </div>
        <span class="text-red-500 text-xl">⚠</span>
      </button>
    </div>

    <div class="mt-auto pt-8 text-center mb-40">
      <div class="label">SMART2FA · OXID EDITION · v2.0</div>
      <div class="text-[10px] text-zinc-600 mt-1 font-mono">AES-256 · PBKDF2 · OTPAUTH RFC 6238</div>
    </div>

    <!-- Wipe modal -->
    <transition name="fade">
      <div v-if="showWipe" class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0" data-testid="wipe-modal">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="showWipe = false"></div>
        <div class="relative glass rounded-lg p-5 w-full max-w-sm">
          <div class="label mb-1 text-red-500">IRREVERSIBLE</div>
          <h3 class="font-mono text-xl font-bold mb-1.5">Wipe everything?</h3>
          <p class="text-sm text-zinc-400 mb-4">
            This deletes your PIN and all 2FA tokens permanently. There is no recovery.
          </p>
          <label class="label block mb-1.5">Type <span class="text-red-500">WIPE</span> to confirm:</label>
          <input v-model="wipeConfirm" type="text" class="input-steel uppercase mb-4" data-testid="wipe-input" />
          <div class="flex gap-2 justify-end">
            <button class="btn-ghost" @click="showWipe = false" data-testid="wipe-cancel">Cancel</button>
            <button class="btn-rust" :disabled="wipeConfirm !== 'WIPE'" :class="{ 'opacity-40 cursor-not-allowed': wipeConfirm !== 'WIPE' }" style="background-color:#DC2626; color:white" @click="doWipe" data-testid="wipe-confirm">Wipe Now</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Import PIN prompt -->
    <transition name="fade">
      <div v-if="importPayload" class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0" data-testid="import-modal">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="importPayload = null"></div>
        <div class="relative glass rounded-lg p-5 w-full max-w-sm">
          <div class="label mb-1">DECRYPT BACKUP</div>
          <h3 class="font-mono text-xl font-bold mb-1.5">Enter backup PIN</h3>
          <p class="text-sm text-zinc-400 mb-4">
            Provide the PIN that was active when this backup was created.
          </p>
          <input v-model="importPin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" class="input-steel mb-2 text-center text-2xl tracking-[0.5em] font-mono" data-testid="import-pin-input" />
          <p v-if="importError" class="text-xs text-red-400 mb-3 font-mono">{{ importError }}</p>
          <div class="flex gap-2 justify-end">
            <button class="btn-ghost" @click="cancelImport" data-testid="import-cancel">Cancel</button>
            <button class="btn-rust" @click="doImport" data-testid="import-confirm">Import</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore, AUTO_LOCK_OPTIONS } from '../stores/settings'
import { useAuthStore } from '../stores/auth'
import { useVaultStore } from '../stores/vault'
import { useToast } from '../composables/useToast'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Toast } from '@capacitor/toast'

const settings = useSettingsStore()
const auth = useAuthStore()
const vault = useVaultStore()
const router = useRouter()
const { push } = useToast()

const autoLockOptions = AUTO_LOCK_OPTIONS

const showWipe = ref(false)
const wipeConfirm = ref('')
const importPayload = ref(null)
const importPin = ref('')
const importError = ref('')
const bioBusy = ref(false)

async function enableBio() {
  if (!auth.pin) {
    push({ title: 'PIN REQUIRED', description: 'Unlock first', variant: 'error' })
    return
  }
  bioBusy.value = true
  try {
    await auth.enableBiometric(auth.pin)
    push({ title: 'BIOMETRIC ARMED', description: 'Touch ID / Face ID enabled', variant: 'success' })
  } catch (e) {
    push({ title: 'ENABLE FAILED', description: e?.message?.slice(0, 80) || 'Unknown error', variant: 'error' })
  } finally {
    bioBusy.value = false
  }
}

function disableBio() {
  auth.disableBiometric()
  push({ title: 'BIOMETRIC DISARMED', description: 'Removed from this device', variant: 'success' })
}

async function doExport() {
  const payload = vault.exportEncrypted()
  if (!payload) return

  const filename = `smart2fa-oxid-${Date.now()}.oxid`

  const platform = Capacitor.getPlatform()

  if (platform !== 'web') {
    try {
      // Конвертируем в base64 как в wallet-pro
      //const base64 = btoa(payload)
      await Filesystem.writeFile({
        path: filename,
        data: payload, //base64,
        directory: Directory.Documents,
      })
      await Toast.show({
        text: `File saved: ${filename}`,
        duration: 'long'
      })
      push({ title: 'BACKUP READY', description: `File saved: ${filename} in file system`, variant: 'success',  duration: 5000 })
    } catch (e) {
      await Toast.show({
        text: `Error: ${e.message}`,
        duration: 'long'
      })
      push({ title: 'EXPORT FAILED', description: e.message, variant: 'error' })
    }
  } else {
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    push({ title: 'BACKUP READY', description: 'Encrypted file downloaded', variant: 'success',  duration: 5000 })
  }
}

async function onImportFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const text = await file.text()
  importPayload.value = text
  importPin.value = ''
  importError.value = ''
  e.target.value = ''
}

function doImport() {
  try {
    const count = vault.importEncrypted(importPayload.value, importPin.value || null)
    push({ title: 'IMPORT COMPLETE', description: `${count} tokens added`, variant: 'success' })
    cancelImport()
  } catch (e) {
    importError.value = 'Invalid backup or wrong PIN.'
  }
}

function cancelImport() {
  importPayload.value = null
  importPin.value = ''
  importError.value = ''
}

function doWipe() {
  if (wipeConfirm.value !== 'WIPE') return
  vault.clearAll()
  auth.wipe()
  push({ title: 'VAULT WIPED', description: 'All data destroyed', variant: 'error' })
  router.replace({ name: 'pin' })
}

function lock() {
  auth.lock()
  router.replace({ name: 'pin' })
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 140ms linear; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
