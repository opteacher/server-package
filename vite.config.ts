import vue from '@vitejs/plugin-vue'
import { URL, fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import babel from '@rollup/plugin-babel'

// https://vitejs.dev/config/
export default ({ mode }) =>
  defineConfig({
    base: '/server-package',
    build: {
      outDir: 'server/public/server-package'
    },
    plugins: [
      vue(),
      {
        ...babel({
          include: [/\.vue$/, /\.ts$/, /\.tsx$/, /\.jsx$/, /\.js$/],
          extensions: ['.vue', '.ts', '.js', '.tsx', '.jsx'],
          presets: [
            [
              '@babel/preset-env',
              { useBuiltIns: 'usage', corejs: 3, targets: { chrome: '68' }, modules: false }
            ]
          ]
        }),
        apply: 'serve'
      }
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@lib': fileURLToPath(new URL('./src/lib/frontend-library/src', import.meta.url))
      }
    },
    server: {
      port: 5174,
      proxy: {
        '^/server-package/(mdl|api)': {
          target: 'http://218.242.30.111:6031',
          ws: true,
          changeOrigin: true
        },
        '^/stock-crawler/(api|job)': {
          target: 'http://127.0.0.1:7132',
          ws: true,
          changeOrigin: true
        },
        '/mqtt$': {
          target: 'ws://218.242.30.111:8083/mqtt',
          ws: true,
          changeOrigin: true
        }
      }
    },
    define: {
      'process.env': loadEnv(mode, process.cwd())
    }
  })
