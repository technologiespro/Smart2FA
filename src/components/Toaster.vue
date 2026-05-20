<template>
  <div class="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
    <transition-group name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="metallic px-4 py-3 rounded-md min-w-[220px] max-w-[320px] shadow-lg flex items-center gap-3"
        :class="{
          'border-rust': t.variant === 'success',
          'border-red-600': t.variant === 'error',
        }"
        data-testid="toast"
      >
        <span
          class="w-1.5 h-6 rounded-sm"
          :class="t.variant === 'error' ? 'bg-red-500' : 'bg-rust'"
        ></span>
        <div class="flex-1 min-w-0">
          <div v-if="t.title" class="text-sm font-mono font-semibold tracking-wide" data-testid="toast-title">{{ t.title }}</div>
          <div v-if="t.description" class="text-xs opacity-70 truncate">{{ t.description }}</div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useToast } from '../composables/useToast'
const { toasts } = useToast()
</script>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: opacity 140ms linear, transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from { opacity: 0; transform: translateY(8px); }
.toast-leave-to { opacity: 0; transform: translateY(8px); }
</style>
