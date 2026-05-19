<template>
  <transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-[90] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0"
      data-testid="edit-token-modal"
    >
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="cancel"></div>

      <div class="relative glass rounded-lg p-5 w-full max-w-sm animate-slide-up">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="label">EDIT TOKEN</div>
            <h3 class="font-mono text-xl font-bold tracking-tighter mt-0.5">Refine Identity</h3>
          </div>
          <button
            type="button"
            class="p-1.5 text-zinc-400 hover:text-rust transition-colors"
            @click="cancel"
            data-testid="edit-cancel-x"
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="flex flex-col gap-3">
          <div>
            <label class="label block mb-1.5">Issuer / Service</label>
            <input
              v-model="form.issuer"
              type="text"
              class="input-steel"
              data-testid="edit-input-issuer"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="label block mb-1.5">Description / Mail</label>
            <input
              v-model="form.label"
              type="text"
              class="input-steel"
              data-testid="edit-input-label"
              autocomplete="off"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label class="label block mb-1.5">Category</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="(meta, key) in categories"
                :key="key"
                type="button"
                class="metallic px-2 py-2 rounded-md flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-semibold transition-all"
                :class="form.category === key ? 'border-rust text-rust' : 'text-zinc-400'"
                @click="form.category = key"
                :data-testid="`edit-cat-${key}`"
              >
                <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: meta.color }"></span>
                {{ meta.label }}
              </button>
            </div>
          </div>

          <!-- Secret key — blurred by default -->
          <div>
            <label class="label flex items-center justify-between mb-1.5">
              <span>Secret Key (Base32)</span>
              <span class="text-[10px] tracking-widest" :class="revealed ? 'text-rust' : 'text-zinc-500'">
                {{ revealed ? 'REVEALED' : 'CLICK TO REVEAL' }}
              </span>
            </label>
            <button
              type="button"
              class="w-full text-left input-steel font-mono uppercase select-text transition-all duration-150"
              :class="revealed ? '' : 'secret-blur'"
              :title="revealed ? 'Click to hide' : 'Click to reveal'"
              @click="revealed = !revealed"
              data-testid="edit-secret-toggle"
            >
              <span class="block break-all leading-relaxed text-sm">{{ form.secret || '—' }}</span>
            </button>
            <div class="flex items-center justify-between mt-1.5">
              <p class="text-[10px] text-zinc-500 font-mono tracking-wide">
                Read-only. Wipe & re-add to change.
              </p>
              <button
                type="button"
                class="text-[10px] uppercase tracking-widest text-rust hover:underline font-mono"
                @click="showQR = true"
                data-testid="edit-show-qr"
              >Show as QR ›</button>
            </div>
          </div>
        </div>

        <div class="flex gap-2 justify-end mt-5">
          <button type="button" class="btn-ghost" @click="cancel" data-testid="edit-cancel">Cancel</button>
          <button type="button" class="btn-rust" @click="save" data-testid="edit-save">Save</button>
        </div>

        <!-- Show-as-QR overlay -->
        <transition name="fade">
          <div
            v-if="showQR"
            class="absolute inset-0 z-10 rounded-lg flex flex-col items-center justify-center p-5 backdrop-blur-md bg-black/60"
            data-testid="show-qr-overlay"
          >
            <button
              type="button"
              class="absolute top-3 right-3 p-1.5 text-zinc-300 hover:text-rust"
              @click="showQR = false"
              data-testid="show-qr-close"
              title="Close"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <div class="label mb-1">EXPORT TOKEN</div>
            <h3 class="font-mono text-lg font-bold tracking-tighter mb-3 text-center">Scan with another device</h3>
            <div class="metallic p-3 rounded-md bg-white">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="otpauth QR" class="w-48 h-48" data-testid="show-qr-image" />
              <div v-else class="w-48 h-48 flex items-center justify-center text-charcoal text-xs font-mono">Generating…</div>
            </div>
            <p class="text-[10px] text-zinc-400 mt-3 text-center max-w-[260px]">
              Compatible with Google Authenticator, Authy, 1Password and any RFC 6238 scanner.
            </p>
            <button
              type="button"
              class="mt-3 text-[10px] uppercase tracking-widest text-rust hover:underline font-mono"
              @click="copyURI"
              data-testid="show-qr-copy"
            >Copy URI</button>
          </div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { CATEGORIES } from '../lib/categories'
import { useToast } from '../composables/useToast'

const props = defineProps({
  open: { type: Boolean, default: false },
  token: { type: Object, default: null },
})
const emit = defineEmits(['close', 'save'])

const categories = CATEGORIES
const { push } = useToast()

const form = reactive({
  issuer: '',
  label: '',
  category: 'other',
  secret: '',
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
})

const revealed = ref(false)
const showQR = ref(false)
const qrDataUrl = ref('')

function buildOtpAuthURI() {
  const t = props.token || {}
  const issuer = encodeURIComponent(t.issuer || '')
  const label = encodeURIComponent(t.label || 'account')
  const path = issuer ? `${issuer}:${label}` : label
  const params = new URLSearchParams({
    secret: t.secret || '',
    algorithm: t.algorithm || 'SHA1',
    digits: String(t.digits || 6),
    period: String(t.period || 30),
  })
  if (t.issuer) params.set('issuer', t.issuer)
  return `otpauth://totp/${path}?${params.toString()}`
}

watch(() => props.token, (t) => {
  if (!t) return
  form.issuer = t.issuer || ''
  form.label = t.label || ''
  form.category = t.category || 'other'
  form.secret = t.secret || ''
  form.algorithm = t.algorithm || 'SHA1'
  form.digits = t.digits || 6
  form.period = t.period || 30
  revealed.value = false
  showQR.value = false
  qrDataUrl.value = ''
}, { immediate: true })

watch(showQR, async (val) => {
  if (!val) return
  try {
    const uri = buildOtpAuthURI()
    qrDataUrl.value = await QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 256,
      color: { dark: '#1A1B1E', light: '#FFFFFF' },
    })
  } catch (e) {
    qrDataUrl.value = ''
    push({ title: 'QR FAILED', description: e?.message || 'Generation error', variant: 'error' })
  }
})

async function copyURI() {
  try {
    await navigator.clipboard.writeText(buildOtpAuthURI())
    push({ title: 'URI COPIED', description: 'otpauth:// link in clipboard', variant: 'success' })
  } catch {
    push({ title: 'COPY FAILED', variant: 'error' })
  }
}

function cancel() {
  revealed.value = false
  showQR.value = false
  emit('close')
}

function save() {
  emit('save', {
    id: props.token.id,
    issuer: form.issuer.trim(),
    label: form.label.trim(),
    category: form.category,
  })
  revealed.value = false
  showQR.value = false
}
</script>

<style scoped>
.secret-blur {
  filter: blur(6px);
  user-select: none;
  -webkit-user-select: none;
}

.fade-enter-active, .fade-leave-active { transition: opacity 140ms linear; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
