import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@lib': fileURLToPath(new URL('./src/lib/src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '^/repair-reporter/(mdl|api)': {
        target: 'http://192.168.1.11',
        changeOrigin: true
      }
    }
  }
})
