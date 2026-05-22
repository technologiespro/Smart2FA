<template>
  <div class="min-h-screen flex flex-col px-6 pt-20 pb-8 relative" data-testid="pin-screen">
    <!-- Video background -->
    <video
      class="absolute inset-0 w-full h-full object-cover pointer-events-none"
      src="/bg10.mp4"
      autoplay
      muted
      loop
      playsinline
    ></video>

    <!-- Overlay for readability -->
    <div class="absolute inset-0 bg-black/40 pointer-events-none"></div>

    <div class="relative z-10 flex flex-col items-center text-center">
      <!-- Branded header -->
      <div class="metallic rounded-md px-3 py-1.5 mb-8 inline-flex items-center gap-2">
        <span class="w-1.5 h-1.5 bg-rust rounded-sm animate-pulse"></span>
        <span class="label">SECURE ENTRY</span>
      </div>

      <h1 class="font-mono font-black text-3xl sm:text-4xl tracking-tighter mb-1.5" data-testid="pin-title">
        {{ mode === 'create' ? 'Create PIN' : mode === 'confirm' ? 'Confirm PIN' : 'Enter PIN' }}
      </h1>
      <p class="text-sm text-zinc-400 mb-10 max-w-[280px]" data-testid="pin-subtitle">
        <template v-if="mode === 'create'">Set a 4-digit code to lock your vault.</template>
        <template v-else-if="mode === 'confirm'">Re-enter your PIN to confirm.</template>
        <template v-else>Unlock your encrypted authenticator vault.</template>
      </p>

      <PinDots :filled="pinInput.length" :length="4" />

      <div v-if="error" class="mt-5 text-xs uppercase tracking-widest text-red-500 font-mono animate-shake" data-testid="pin-error">
        {{ error }}
      </div>
      <div v-else class="mt-5 h-4"></div>

      <!-- Biometric unlock button (only on enter mode + registered) -->
      <button
        v-if="mode === 'enter' && auth.biometricRegistered && auth.biometricSupported"
        type="button"
        class="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs uppercase tracking-widest font-semibold text-rust border border-rust/40 hover:bg-rust/10 transition-colors"
        @click="tryBiometric(false)"
        data-testid="biometric-unlock-button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10"/>
          <path d="M7 19c0-2.76 2.24-5 5-5s5 2.24 5 5"/>
          <path d="M12 9v6"/>
          <circle cx="12" cy="11" r="1"/>
        </svg>
        <span>Use Biometrics</span>
      </button>
    </div>

    <div class="relative z-10 mt-auto mb-auto">
      <Keypad @press="onPress" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useVaultStore } from '../stores/vault'
import PinDots from '../components/PinDots.vue'
import Keypad from '../components/Keypad.vue'

const auth = useAuthStore()
const vault = useVaultStore()
const router = useRouter()

const pinInput = ref('')
const firstPin = ref('')
const error = ref('')
const mode = ref('enter') // 'enter' | 'create' | 'confirm'

onMounted(async () => {
  // Ensure async init completes (biometric availability checks)
  if (!auth.biometricSupported && !auth.hasPin) {
    await auth.init()
  }
  mode.value = auth.hasPin ? 'enter' : 'create'
  // Auto-prompt biometric on entry mode if registered
  if (mode.value === 'enter' && auth.biometricRegistered && auth.biometricSupported) {
    setTimeout(() => { tryBiometric(true) }, 250)
  }
})

async function tryBiometric(silent = false) {
  error.value = ''
  try {
    await auth.unlockWithBiometric()
    vault.load()
    router.replace({ name: 'vault' })
  } catch (e) {
    const msg = (e?.message || e?.name || 'Biometric failed').toString()
    if (!silent) {
      error.value = msg.toUpperCase().slice(0, 60)
    }
    console.warn('[Oxid] Biometric unlock failed:', e)
  }
}

function onPress(key) {
  error.value = ''
  if (key === 'back') {
    pinInput.value = pinInput.value.slice(0, -1)
    return
  }
  if (pinInput.value.length >= 4) return
  pinInput.value += String(key)
}

watch(pinInput, async (val) => {
  if (val.length !== 4) return
  await new Promise(r => setTimeout(r, 120))

  if (mode.value === 'create') {
    firstPin.value = val
    pinInput.value = ''
    mode.value = 'confirm'
    return
  }
  if (mode.value === 'confirm') {
    if (val !== firstPin.value) {
      error.value = 'PINs do not match'
      pinInput.value = ''
      firstPin.value = ''
      mode.value = 'create'
      return
    }
    auth.createPin(val)
    vault.load()
    router.replace({ name: 'vault' })
    return
  }
  // Enter mode
  const ok = auth.verifyPin(val)
  if (!ok) {
    error.value = 'Incorrect PIN'
    pinInput.value = ''
    return
  }
  vault.load()
  router.replace({ name: 'vault' })
})
</script>
