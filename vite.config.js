import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  define: {
    isOS: JSON.stringify(process.env.VITE_OS || 'web'),
  },
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss'
    },
    watch: {
      usePolling: true,
      interval: 1000,
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  }
})
