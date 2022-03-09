module.exports = {
  outputDir: 'server/dist/public/server-package',
  assetsDir: 'static',
  devServer: {
    proxy: {
      '/server-package/(mdl|api)': {
        target: 'http://opteacher.top',
        ws: true,
        changeOrigin: true
      }
    }
  }
}
