module.exports = {
  publicPath: '/server-package',
  outputDir: 'server/dist/public/server-package',
  assetsDir: 'static',
  devServer: {
    proxy: {
      '/server-package/(mdl|api)': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true
      }
    }
  }
}
