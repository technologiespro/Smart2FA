<template>
  <div class="min-h-screen pb-32" data-testid="vault-dashboard">
    <!-- Sticky header -->
    <header class="sticky top-0 z-40 glass">
      <div class="px-4 pt-6 pb-3">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="label">VAULT</div>
            <h1 class="font-mono font-black text-2xl tracking-tighter" data-testid="vault-title">
              {{ vault.tokens.length }} <span class="text-rust">·</span> CODES
            </h1>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="metallic w-10 h-10 rounded-md flex items-center justify-center hover:border-rust/50 transition-colors"
              @click="goSettings"
              data-testid="settings-button"
              title="Settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            </button>
            <button
              type="button"
              class="metallic w-10 h-10 rounded-md flex items-center justify-center hover:border-rust/50 transition-colors"
              @click="lock"
              data-testid="lock-button"
              title="Lock"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            v-model="query"
            type="text"
            placeholder="SEARCH BY ISSUER, ACCOUNT, CATEGORY"
            class="input-steel pl-9 text-xs tracking-widest uppercase"
            data-testid="search-input"
          />
        </div>

        <!-- Category filter chips -->
        <div class="flex gap-2 overflow-x-auto mt-3 pb-1 -mx-1 px-1" data-testid="category-filter">
          <button
            v-for="cat in catFilters"
            :key="cat.key"
            type="button"
            class="shrink-0 metallic px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold transition-all"
            :class="activeCat === cat.key ? 'border-rust text-rust' : 'text-zinc-400'"
            @click="activeCat = activeCat === cat.key ? null : cat.key"
            :data-testid="`filter-${cat.key}`"
          >
            <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: cat.color }"></span>
            {{ cat.label }}
          </button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="px-4 pt-4">
      <!-- Empty state -->
      <div v-if="vault.tokens.length === 0" class="flex flex-col items-center text-center pt-12" data-testid="empty-state">
        <img :src="emptyImg" alt="Empty vault" class="w-44 h-44 object-contain opacity-90 mb-6 select-none" />
        <h2 class="font-mono text-xl font-bold tracking-tighter mb-2">VAULT EMPTY</h2>
        <p class="text-sm text-zinc-400 max-w-[260px] mb-6">
          Forge your first 2FA token. Tap the + button to begin.
        </p>
        <button type="button" class="btn-rust" @click="goAdd" data-testid="add-first-button">
          <span>+ Forge First Token</span>
        </button>
      </div>

      <!-- No results state -->
      <div v-else-if="visibleTokens.length === 0" class="text-center py-20" data-testid="no-results">
        <div class="font-mono text-sm uppercase tracking-widest text-zinc-500">No matching tokens.</div>
      </div>

      <!-- List -->
      <div v-else class="flex flex-col gap-3" data-testid="token-list">
        <TokenCard
          v-for="t in visibleTokens"
          :key="t.id"
          :token="t"
          @delete="confirmDelete"
          @edit="openEdit"
        />
      </div>
    </div>

    <!-- FAB -->
    <button
      type="button"
      class="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-rust-glow active:scale-95 transition-transform"
      style="background-color:#E25822; color:#1A1B1E"
      @click="goAdd"
      data-testid="fab-add"
      title="Add Token"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
    </button>

    <!-- Edit Token Modal -->
    <EditTokenModal
      :open="!!toEdit"
      :token="toEdit"
      @close="toEdit = null"
      @save="onEditSave"
    />

    <!-- Delete confirmation -->
    <transition name="fade">
      <div v-if="toDelete" class="fixed inset-0 z-[80] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0" data-testid="delete-modal">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="toDelete = null"></div>
        <div class="relative glass rounded-lg p-5 w-full max-w-sm">
          <div class="label mb-1">CONFIRM DESTRUCTION</div>
          <h3 class="font-mono text-xl font-bold mb-1.5">Delete token?</h3>
          <p class="text-sm text-zinc-400 mb-5">
            <span class="font-mono">{{ toDelete.issuer }}</span> · {{ toDelete.label }}<br />
            This cannot be undone.
          </p>
          <div class="flex gap-2 justify-end">
            <button class="btn-ghost" @click="toDelete = null" data-testid="delete-cancel">Cancel</button>
            <button
              class="btn-rust"
              style="background-color:#DC2626; color:white"
              @click="doDelete"
              data-testid="delete-confirm"
            >Delete</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useVaultStore } from '../stores/vault'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import TokenCard from '../components/TokenCard.vue'
import EditTokenModal from '../components/EditTokenModal.vue'
import { CATEGORIES } from '../lib/categories'

const vault = useVaultStore()
const auth = useAuthStore()
const router = useRouter()
const { push } = useToast()

const emptyImg = '/circle2.png'

const query = ref('')
const activeCat = ref(null)
const toDelete = ref(null)
const toEdit = ref(null)

const catFilters = Object.entries(CATEGORIES).map(([key, v]) => ({ key, ...v }))

onMounted(() => {
  if (!vault.loaded) vault.load()
})

const visibleTokens = computed(() => {
  let list = vault.filtered(query.value)
  if (activeCat.value) list = list.filter(t => t.category === activeCat.value)
  return list
})

function goAdd() { router.push({ name: 'add' }) }
function goSettings() { router.push({ name: 'settings' }) }
function lock() {
  auth.lock()
  router.replace({ name: 'pin' })
}
function confirmDelete(token) { toDelete.value = token }
function openEdit(token) { toEdit.value = token }
function onEditSave(patch) {
  vault.updateToken(patch.id, {
    issuer: patch.issuer,
    label: patch.label,
    category: patch.category,
  })
  push({ title: 'TOKEN UPDATED', description: patch.issuer, variant: 'success' })
  toEdit.value = null
}
function doDelete() {
  const t = toDelete.value
  vault.removeToken(t.id)
  push({ title: 'TOKEN PURGED', description: t.issuer, variant: 'success' })
  toDelete.value = null
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 140ms linear; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
