<template>
  <form class="min-h-screen flex flex-col px-6 pt-20 pb-10" @submit.prevent="submit" data-testid="manual-screen">
    <div class="mb-6">
      <button type="button" class="label flex items-center gap-1 text-zinc-400 hover:text-rust transition-colors" @click="$router.back()" data-testid="back-button">
        ← Back
      </button>
      <div class="label mt-4">MANUAL ENTRY</div>
      <h1 class="font-mono font-black text-2xl tracking-tighter">Type Secret Key</h1>
    </div>

    <div class="flex flex-col gap-4">
      <div>
        <label class="label block mb-1.5">Issuer / Service</label>
        <input v-model="form.issuer" type="text" placeholder="e.g. GitHub, Coinbase" class="input-steel" data-testid="input-issuer" required />
      </div>

      <div>
        <label class="label block mb-1.5">Account / Email</label>
        <input v-model="form.label" type="text" placeholder="e.g. user@email.com" class="input-steel" data-testid="input-label" />
      </div>

      <div>
        <label class="label block mb-1.5">Secret Key (Base32)</label>
        <input
          v-model="form.secret"
          type="text"
          spellcheck="false"
          autocapitalize="characters"
          placeholder="JBSWY3DPEHPK3PXP"
          class="input-steel uppercase"
          data-testid="input-secret"
          required
        />
        <p v-if="secretError" class="text-xs text-red-400 mt-1.5 font-mono" data-testid="secret-error">{{ secretError }}</p>
      </div>

      <div>
        <label class="label block mb-1.5">Category</label>
        <div class="grid grid-cols-3 gap-2" data-testid="category-select">
          <button
            v-for="(meta, key) in categories"
            :key="key"
            type="button"
            class="metallic px-2 py-2 rounded-md flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] font-semibold transition-all"
            :class="form.category === key ? 'border-rust text-rust' : 'text-zinc-400'"
            @click="form.category = key"
            :data-testid="`cat-${key}`"
          >
            <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: meta.color }"></span>
            {{ meta.label }}
          </button>
        </div>
      </div>

      <details class="metallic rounded-md p-3">
        <summary class="label cursor-pointer select-none">Advanced</summary>
        <div class="grid grid-cols-3 gap-3 mt-3">
          <div>
            <label class="label block mb-1">Algo</label>
            <select v-model="form.algorithm" class="input-steel" data-testid="input-algorithm">
              <option>SHA1</option>
              <option>SHA256</option>
              <option>SHA512</option>
            </select>
          </div>
          <div>
            <label class="label block mb-1">Digits</label>
            <select v-model.number="form.digits" class="input-steel" data-testid="input-digits">
              <option :value="6">6</option>
              <option :value="7">7</option>
              <option :value="8">8</option>
            </select>
          </div>
          <div>
            <label class="label block mb-1">Period</label>
            <select v-model.number="form.period" class="input-steel" data-testid="input-period">
              <option :value="30">30s</option>
              <option :value="60">60s</option>
            </select>
          </div>
        </div>
      </details>
    </div>

    <div class="mt-auto pt-8 flex gap-2">
      <button type="button" class="btn-ghost flex-1" @click="$router.back()" data-testid="cancel-button">Cancel</button>
      <button type="submit" class="btn-rust flex-1" data-testid="save-button">Forge Token</button>
    </div>
  </form>
</template>

<script setup>
import { reactive, computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useVaultStore } from '../stores/vault'
import { useToast } from '../composables/useToast'
import { isValidBase32Secret } from '../lib/totp'
import { CATEGORIES, guessCategory } from '../lib/categories'

const router = useRouter()
const vault = useVaultStore()
const { push } = useToast()

const categories = CATEGORIES

const form = reactive({
  issuer: '',
  label: '',
  secret: '',
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  category: 'other',
})

const secretError = ref('')

watch(() => form.issuer + form.label, () => {
  // auto-suggest category
  if (form.category === 'other') {
    const g = guessCategory(form.issuer, form.label)
    if (g !== 'other') form.category = g
  }
})

function submit() {
  secretError.value = ''
  const cleaned = form.secret.replace(/\s+/g, '').toUpperCase()
  if (!isValidBase32Secret(cleaned)) {
    secretError.value = 'Invalid Base32 secret. Allowed: A-Z and 2-7.'
    return
  }
  const { isDuplicate } = vault.addToken({ ...form, secret: cleaned })
  if (isDuplicate) {
    push({ title: 'ALREADY IN VAULT', description: `${form.issuer} · ${form.label}`, variant: 'error' })
    return
  }
  push({ title: 'TOKEN FORGED', description: form.issuer, variant: 'success' })
  router.replace({ name: 'vault' })
}
</script>
