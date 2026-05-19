<template>
  <div class="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto" data-testid="keypad">
    <button
      v-for="key in keys"
      :key="key.value"
      type="button"
      class="key metallic h-16 sm:h-[68px] rounded-md flex items-center justify-center text-2xl font-mono font-medium select-none active:scale-[0.97] transition-transform duration-75"
      :class="{ 'opacity-0 pointer-events-none': key.value === null }"
      :disabled="key.value === null"
      :data-testid="`keypad-${key.testid}`"
      @click="$emit('press', key.value)"
    >
      <span v-if="key.type === 'digit'">{{ key.label }}</span>
      <span v-else-if="key.type === 'back'" class="text-rust text-xl tracking-tight">⌫</span>
      <span v-else class="text-xs uppercase tracking-widest text-zinc-400">{{ key.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineEmits(['press'])

const keys = [
  { value: '1', label: '1', type: 'digit', testid: '1' },
  { value: '2', label: '2', type: 'digit', testid: '2' },
  { value: '3', label: '3', type: 'digit', testid: '3' },
  { value: '4', label: '4', type: 'digit', testid: '4' },
  { value: '5', label: '5', type: 'digit', testid: '5' },
  { value: '6', label: '6', type: 'digit', testid: '6' },
  { value: '7', label: '7', type: 'digit', testid: '7' },
  { value: '8', label: '8', type: 'digit', testid: '8' },
  { value: '9', label: '9', type: 'digit', testid: '9' },
  { value: null, label: '', type: 'empty', testid: 'empty' },
  { value: '0', label: '0', type: 'digit', testid: '0' },
  { value: 'back', label: '⌫', type: 'back', testid: 'back' },
]
</script>

<style scoped>
.key:hover {
  border-color: rgba(226, 88, 34, 0.4);
}
</style>
