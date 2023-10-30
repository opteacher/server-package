import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import istanbul from 'vite-plugin-istanbul'

// https://vitejs.dev/config/
export default ({ mode }) =>
  defineConfig({
    plugins: [
      vue(),
      vueJsx(),
      istanbul({
        include: 'src/*',
        exclude: ['node_modules', 'tests/**'],
        extension: ['.js', '.ts', '.vue'],
        cypress: true
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@lib': fileURLToPath(new URL('./src/lib/frontend-library/src', import.meta.url))
      }
    },
    server: {
      proxy: {
        '^/server-package/(mdl|api)': {
          target: 'http://127.0.0.1:4000/',
          ws: true,
          changeOrigin: true
        }
      }
    },
    define: {
      'process.env': loadEnv(mode, process.cwd())
    }
  })
