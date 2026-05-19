<template>
  <div class="min-h-screen relative overflow-hidden" data-testid="app-root">
    <!-- Subtle industrial grid background -->
    <div class="absolute inset-0 bg-grid opacity-60 pointer-events-none"></div>

    <!-- Top corner brand tag -->
    <div class="absolute top-3 left-4 z-40 flex items-center gap-2 pointer-events-none select-none">
      <div class="w-1.5 h-1.5 rounded-sm bg-rust"></div>
      <span class="label tracking-[0.3em]">SMART2FA · OXID</span>
    </div>

    <main class="relative z-10 mx-auto max-w-md min-h-screen">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <Toaster />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'
import { useAutoLock } from './composables/useAutoLock'
import Toaster from './components/Toaster.vue'

const auth = useAuthStore()
const settings = useSettingsStore()

// Initialize stores first (settings must be loaded before auto-lock arms)
settings.init()

// Arm the auto-lock listener (runs as long as App is mounted)
useAutoLock()

onMounted(async () => {
  await auth.init()
})
</script>

<style>
.page-enter-active, .page-leave-active {
  transition: opacity 140ms linear, transform 140ms cubic-bezier(0.16, 1, 0.3, 1);
}
.page-enter-from { opacity: 0; transform: translateY(6px); }
.page-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
