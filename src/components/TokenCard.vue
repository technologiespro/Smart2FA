<template>
  <div
    class="metallic rounded-lg p-4 relative overflow-hidden noise group transition-all duration-150 hover:border-rust/40"
    :data-testid="`token-card-${token.id}`"
  >
    <!-- Top row: meta -->
    <div class="flex items-start justify-between mb-2 gap-2">
      <div class="min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <CategoryDot :category="token.category" />
          <span v-if="token.algorithm && token.algorithm !== 'SHA1'" class="label">{{ token.algorithm }}</span>
        </div>
        <div class="text-base font-semibold truncate" :data-testid="`token-issuer-${token.id}`">{{ token.issuer || 'Untitled' }}</div>
        <div class="text-xs text-zinc-400 truncate" :data-testid="`token-label-${token.id}`">{{ token.label || '—' }}</div>
      </div>

      <div class="flex flex-col items-end gap-1">
        <button
          type="button"
          class="opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity p-1.5 rounded text-zinc-400 hover:text-rust"
          :data-testid="`token-delete-${token.id}`"
          @click.stop="$emit('delete', token)"
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
        </button>
        <button
          type="button"
          class="opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity p-1.5 rounded text-zinc-400 hover:text-rust"
          :data-testid="`token-edit-${token.id}`"
          @click.stop="$emit('edit', token)"
          title="Edit"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </button>
      </div>
    </div>

    <!-- Code -->
    <button
      type="button"
      class="w-full text-left mt-1 mb-3 cursor-pointer select-text"
      :data-testid="`token-code-${token.id}`"
      @click="copy"
    >
      <div class="font-mono font-medium tracking-[0.18em] text-[34px] sm:text-[40px] leading-none text-white dark:text-white" :class="{ 'text-charcoal': false }">
        <span class="text-charcoal dark:text-white" v-html="formatted"></span>
      </div>
    </button>

    <!-- Progress bar -->
    <div class="absolute left-0 right-0 bottom-0 h-[2px] bg-white/5 dark:bg-white/5">
      <div
        class="h-full transition-[width] duration-1000 ease-linear"
        :class="critical ? 'bg-red-500' : 'bg-rust'"
        :style="{ width: progress + '%' }"
        :data-testid="`token-progress-${token.id}`"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { generateTOTP, secondsRemaining } from '../lib/totp'
import { useToast } from '../composables/useToast'
import CategoryDot from './CategoryDot.vue'

const props = defineProps({ token: { type: Object, required: true } })
defineEmits(['delete', 'edit'])

const code = ref('------')
const remaining = ref(props.token.period || 30)
let timer = null

function tick() {
  code.value = generateTOTP(props.token)
  remaining.value = secondsRemaining(props.token.period || 30)
}

onMounted(() => {
  tick()
  timer = setInterval(tick, 1000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

const period = computed(() => props.token.period || 30)
const progress = computed(() => Math.max(0, Math.min(100, (remaining.value / period.value) * 100)))
const critical = computed(() => remaining.value <= 5)
const formatted = computed(() => {
  const c = code.value
  if (!c || c.length < 6) return c
  const half = Math.ceil(c.length / 2)
  return `${c.slice(0, half)}<span class="text-rust mx-1">·</span>${c.slice(half)}`
})

const { push } = useToast()

async function copy() {
  try {
    await navigator.clipboard.writeText(code.value)
    push({ title: 'COPIED', description: `${props.token.issuer || 'Code'} · ${code.value}`, variant: 'success' })
  } catch {
    push({ title: 'COPY FAILED', variant: 'error' })
  }
}
</script>
