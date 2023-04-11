/** @type {import('tailwindcss').Config} */
import flib from './src/lib/tailwind.config'
export default {
  corePlugins: {
    preflight: false
  },
  important: true,
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      ...flib.theme.extend,
      backgroundImage: {
        login: 'url(/assets/background.png)'
      }
    },
    textColor: theme => ({
      ...flib.theme.textColor(theme)
    }),
    backgroundColor: theme => ({
      ...flib.theme.backgroundColor(theme)
    }),
    borderColor: theme => ({
      ...flib.theme.borderColor(theme)
    })
  },
  plugins: [],
}

