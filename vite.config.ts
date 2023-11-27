import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
export default ({ mode }) =>
  defineConfig({
    base: '/server-package',
    build: {
      outDir: 'server/public/server-package'
    },
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@lib': fileURLToPath(new URL('./src/lib/frontend-library/src', import.meta.url))
      }
    },
    server: {
      proxy: {
        '^/server-package/(mdl|api)': {
          target: 'http://127.0.0.1:4000',
          ws: true,
          changeOrigin: true
        }
      }
    },
    define: {
      'process.env': loadEnv(mode, process.cwd())
    }
  })
