import { defineConfig } from 'cypress'
import { initPlugin } from '@frsource/cypress-plugin-visual-regression-diff/plugins'
import regCdCovTask from '@cypress/code-coverage/task'

export default defineConfig({
  env: {
    pluginVisualRegressionCleanupUnusedImages: false,
    pluginVisualRegressionMaxDiffThreshold: 0.1,
    pluginVisualRegressionDiffConfig: { includeAA: false }
  },
  component: {
    viewportWidth: 1280,
    viewportHeight: 800,
    devServer: {
      framework: 'vue-cli',
      bundler: 'webpack'
    },
    setupNodeEvents(on, config) {
      initPlugin(on, config)
      regCdCovTask(on, config)
      return config
    }
  }
})
