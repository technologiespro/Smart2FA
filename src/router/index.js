import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'pin', component: () => import('../views/PinScreen.vue') },
  { path: '/vault', name: 'vault', component: () => import('../views/VaultDashboard.vue'), meta: { requiresUnlock: true } },
  { path: '/add', name: 'add', component: () => import('../views/AddAccount.vue'), meta: { requiresUnlock: true } },
  { path: '/scan', name: 'scan', component: () => import('../views/ScanQR.vue'), meta: { requiresUnlock: true } },
  { path: '/manual', name: 'manual', component: () => import('../views/ManualEntry.vue'), meta: { requiresUnlock: true } },
  { path: '/settings', name: 'settings', component: () => import('../views/Settings.vue'), meta: { requiresUnlock: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresUnlock && !auth.unlocked) {
    return { name: 'pin' }
  }
  if (to.name === 'pin' && auth.unlocked) {
    return { name: 'vault' }
  }
})

export default router
