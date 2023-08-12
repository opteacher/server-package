const path = require('path')

module.exports = {
  publicPath: '/server-package',
  outputDir: 'server/public/server-package',
  assetsDir: 'static',
  devServer: {
    port: '8081',
    proxy: {
      '/server-package/(mdl|api)': {
        target: 'http://192.168.1.11/',
        ws: true,
        changeOrigin: true
      }
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@lib': path.resolve('./src/lib/frontend-library/src')
      }
    }
  }
}
