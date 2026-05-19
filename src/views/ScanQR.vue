<template>
  <div class="min-h-screen flex flex-col px-6 pt-20 pb-10" data-testid="scan-screen">
    <div class="mb-6">
      <button class="label flex items-center gap-1 text-zinc-400 hover:text-rust transition-colors" @click="$router.back()" data-testid="back-button">
        ← Back
      </button>
      <div class="label mt-4">{{ isMigration ? 'IMPORT FROM GOOGLE AUTH' : 'SCAN QR CODE' }}</div>
      <h1 class="font-mono font-black text-2xl tracking-tighter">{{ isMigration ? 'Migrate Vault' : 'Camera Decoder' }}</h1>
      <p v-if="isMigration" class="text-xs text-zinc-400 mt-1.5">
        In Google Authenticator: Menu → Transfer accounts → Export → show the QR code here.
      </p>
    </div>

    <!-- Camera viewport -->
    <div class="relative aspect-square w-full rounded-lg overflow-hidden metallic mb-5" data-testid="camera-viewport">
      <div id="qr-reader" ref="readerEl" class="absolute inset-0 [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover"></div>

      <!-- Reticle overlay -->
      <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div class="relative w-3/5 aspect-square">
          <span class="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-rust"></span>
          <span class="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-rust"></span>
          <span class="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-rust"></span>
          <span class="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-rust"></span>
          <div v-if="scanning" class="absolute left-0 right-0 h-0.5 bg-rust shadow-rust-glow animate-scan"></div>
        </div>
      </div>

      <!-- Status badge -->
      <div class="absolute top-3 left-3 metallic rounded-md px-2.5 py-1 flex items-center gap-1.5 z-10" data-testid="scan-status">
        <span class="w-1.5 h-1.5 rounded-full" :class="scanning ? 'bg-rust animate-pulse' : 'bg-zinc-500'"></span>
        <span class="text-[10px] uppercase tracking-widest font-mono">{{ scanning ? 'SCANNING' : 'IDLE' }}</span>
      </div>
    </div>

    <div v-if="error" class="metallic rounded-md p-3 mb-4 text-sm text-red-400" data-testid="scan-error">
      {{ error }}
      <button class="block mt-2 text-rust text-xs uppercase tracking-widest" @click="start" data-testid="retry-scan">Retry</button>
    </div>

    <div class="text-xs text-zinc-400 text-center">
      Position the QR code within the frame. Auto-detection on.
    </div>

    <div class="mt-auto pt-6">
      <button class="btn-ghost w-full" @click="$router.replace({ name: 'manual' })" data-testid="switch-manual">
        Use Manual Entry Instead
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVaultStore } from '../stores/vault'
import { useToast } from '../composables/useToast'
import { parseOtpAuthURI } from '../lib/totp'
import { guessCategory } from '../lib/categories'
import { parseGoogleMigrationURI, isGoogleMigrationURI } from '../lib/googleMigration'

const router = useRouter()
const route = useRoute()
const vault = useVaultStore()
const { push } = useToast()

const isMigration = computed(() => route.query.source === 'google')

const scanning = ref(false)
const error = ref('')
const readerEl = ref(null)
let html5QrCode = null

async function start() {
  error.value = ''
  try {
    const mod = await import('html5-qrcode')
    const Html5Qrcode = mod.Html5Qrcode
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode('qr-reader', { verbose: false })
    }
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 12, qrbox: { width: 240, height: 240 } },
      onDecoded,
      () => {}
    )
    scanning.value = true
  } catch (e) {
    scanning.value = false
    error.value = e?.message?.includes('Permission')
      ? 'Camera permission denied. Allow access and retry.'
      : 'Unable to access camera. ' + (e?.message || '')
  }
}

async function stop() {
  scanning.value = false
  try { if (html5QrCode) { await html5QrCode.stop(); await html5QrCode.clear() } } catch {}
  html5QrCode = null
}

function onDecoded(text) {
  // 1. Google Authenticator migration QR
  if (isGoogleMigrationURI(text)) {
    const items = parseGoogleMigrationURI(text)
    if (!items || items.length === 0) {
      error.value = 'Could not decode Google migration QR. Try regenerating it.'
      return
    }
    let added = 0
    let skipped = 0
    for (const it of items) {
      if (it.type !== 'totp') continue // skip HOTP / unsupported for now
      const { isDuplicate } = vault.addToken({
        secret: it.secret,
        issuer: it.issuer,
        label: it.label,
        algorithm: it.algorithm,
        digits: it.digits,
        period: it.period || 30,
        category: guessCategory(it.issuer, it.label),
      })
      if (isDuplicate) skipped++
      else added++
    }
    const desc = skipped > 0
      ? `${added} added · ${skipped} skipped (already in vault)`
      : 'From Google Authenticator'
    push({
      title: `${added} TOKEN${added === 1 ? '' : 'S'} IMPORTED`,
      description: desc,
      variant: added > 0 ? 'success' : 'error',
    })
    stop().finally(() => router.replace({ name: 'vault' }))
    return
  }

  // 2. Standard otpauth:// URI
  const parsed = parseOtpAuthURI(text)
  if (!parsed) {
    error.value = 'Not a valid otpauth URI. Try again or use manual entry.'
    return
  }
  const category = guessCategory(parsed.issuer, parsed.label)
  const { isDuplicate } = vault.addToken({ ...parsed, category })
  if (isDuplicate) {
    push({
      title: 'ALREADY IN VAULT',
      description: `${parsed.issuer || parsed.label} is already forged`,
      variant: 'error',
    })
  } else {
    push({ title: 'TOKEN FORGED', description: parsed.issuer || parsed.label, variant: 'success' })
  }
  stop().finally(() => router.replace({ name: 'vault' }))
}

onMounted(() => { nextTick(start) })
onBeforeUnmount(() => { stop() })
</script>

<style scoped>
@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}
.animate-scan {
  animation: scan 1.8s linear infinite;
}
</style>
