const base = require('./src/lib/frontend-library/tailwind.config')

module.exports = {
  corePlugins: {
    preflight: false
  },
  important: true,
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      ...base.theme.extend,
      backgroundImage: {
        login: 'url(/assets/background.png)'
      }
    },
    textColor: theme => ({
      ...base.theme.textColor(theme)
    }),
    backgroundColor: theme => ({
      ...base.theme.backgroundColor(theme)
    }),
    borderColor: theme => ({
      ...base.theme.borderColor(theme)
    })
  },
  variants: {
    extend: {}
  },
  plugins: []
}
