module.exports = {
  assetsDir: '/*return project.name*/',
  devServer: {
    proxy: {
      '//*return project.name*//(mdl|api)': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@lib': path.resolve('./lib/frontend-library/src')
      }
    }
  }
}
