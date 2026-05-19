<template>
  <div class="flex gap-3 justify-center" data-testid="pin-dots">
    <div
      v-for="i in length"
      :key="i"
      class="w-3.5 h-3.5 rounded-sm transition-all duration-100"
      :class="i <= filled
        ? 'bg-rust shadow-rust-glow scale-110'
        : 'border-2 border-zinc-600 dark:border-white/20 bg-transparent'"
      :data-testid="`pin-dot-${i}`"
    ></div>
  </div>
</template>

<script setup>
defineProps({
  filled: { type: Number, default: 0 },
  length: { type: Number, default: 4 },
})
</script>
