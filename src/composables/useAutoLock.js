import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { useRouter } from 'vue-router'

// Inactivity / auto-lock composable.
// Listens to user activity events and locks the auth store after N seconds of idle.
// Re-arms automatically whenever activity is detected. No-ops when auth is locked.

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove',
  'wheel', 'pointerdown', 'visibilitychange',
]

export function useAutoLock() {
  const auth = useAuthStore()
  const settings = useSettingsStore()
  const router = useRouter()
  const lastActivity = ref(Date.now())
  let timerId = null

  function recordActivity() {
    lastActivity.value = Date.now()
  }

  function clearTimer() {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  function startTimer() {
    clearTimer()
    if (!settings.autoLockEnabled) return
    if (!auth.unlocked) return

    timerId = setInterval(() => {
      if (!auth.unlocked || !settings.autoLockEnabled) {
        clearTimer()
        return
      }
      const elapsedMs = Date.now() - lastActivity.value
      if (elapsedMs >= settings.autoLockSeconds * 1000) {
        clearTimer()
        auth.lock()
        router.replace({ name: 'pin' })
      }
    }, 1000)
  }

  function arm() {
    recordActivity()
    startTimer()
  }

  onMounted(() => {
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, recordActivity, { passive: true })
    }
    arm()
  })

  onBeforeUnmount(() => {
    for (const ev of ACTIVITY_EVENTS) {
      window.removeEventListener(ev, recordActivity)
    }
    clearTimer()
  })

  // React to unlock/lock state changes
  watch(() => auth.unlocked, (val) => {
    if (val) arm()
    else clearTimer()
  })

  // React to settings changes
  watch(
    () => [settings.autoLockEnabled, settings.autoLockSeconds],
    () => { if (auth.unlocked) arm() }
  )

  return { arm, lastActivity }
}
