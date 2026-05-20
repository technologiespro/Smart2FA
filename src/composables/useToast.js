import { ref } from 'vue'

const toasts = ref([])
let counter = 0

export function useToast() {
  function push(opts) {
    const id = ++counter
    const t = {
      id,
      title: opts.title || '',
      description: opts.description || '',
      variant: opts.variant || 'default',
      duration: opts.duration ?? 3500,
    }
    toasts.value.push(t)
    setTimeout(() => {
      toasts.value = toasts.value.filter(x => x.id !== id)
    }, t.duration)
  }
  return { toasts, push }
}
