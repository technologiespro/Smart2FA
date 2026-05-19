<template>
  <span class="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold" :data-testid="`category-${category}`">
    <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: meta.color }"></span>
    <span class="text-zinc-400 dark:text-zinc-400">{{ meta.label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { CATEGORIES } from '../lib/categories'

const props = defineProps({ category: { type: String, default: 'other' } })
const meta = computed(() => CATEGORIES[props.category] || CATEGORIES.other)
</script>
