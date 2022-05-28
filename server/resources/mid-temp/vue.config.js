module.exports = {
  outputDir: 'server/dist/public//*return project.name*/',
  assetsDir: 'static',
  devServer: {
    proxy: {
      '//*return project.name*//(mdl|api)': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  }
}
