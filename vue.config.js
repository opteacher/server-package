module.exports = {
  publicPath: '/server-package',
  outputDir: 'server/public/server-package',
  assetsDir: 'static',
  devServer: {
    port: '8081',
    proxy: {
      '/server-package/(mdl|api)': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true
      }
    }
  }
}
