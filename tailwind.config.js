const base = require('./src/lib/frontend-library/tailwind.config')

module.exports = {
  corePlugins: {
    preflight: false
  },
  important: true,
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  media: false, // or 'media' or 'class'
  theme: {
    extend: {
      ...base.theme.extend,
      backgroundImage: {
        login: 'url(/assets/background.png)'
      },
      lineHeight: {
        '16': '4rem'
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
