module.exports = {
  devServer: {
    proxy: {
      '/server-package': {
        target: 'http://localhost:4000',
        ws: true,
        changeOrigin: true,
      }
    }
  }
}
