// PWA build: extends the upstream web build without modifying it,
// so that merging upstream changes does not cause conflicts.
//
// Usage (from the repository root):
//   pnpm exec webpack --mode=production --config-node-env=production --config pwa/webpack.pwa.config.js

const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const webConfig = require('../_scripts/webpack.web.config.js')
const FreeTubePwaPlugin = require('./FreeTubePwaPlugin.js')
const patches = require('./patches/index.js')

const rootDir = path.join(__dirname, '..')

webConfig.name = 'pwa'

for (const { name, file, search, replace } of patches) {
  webConfig.module.rules.push({
    resource: path.join(rootDir, file),
    enforce: 'pre',
    loader: path.join(__dirname, 'patches/replace-loader.js'),
    options: { name, search, replace }
  })
}

webConfig.plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      { from: path.join(__dirname, 'manifest.webmanifest'), to: 'manifest.webmanifest' },
      { from: path.join(__dirname, 'register-sw.js'), to: 'register-sw.js' },
      { from: path.join(__dirname, 'pwa-config.js'), to: 'pwa-config.js' },
      { from: path.join(rootDir, '_icons/iconColor.png'), to: 'icons/icon-512.png' },
      { from: path.join(rootDir, '_icons/icon.svg'), to: 'icons/icon.svg' },
    ]
  }),
  new FreeTubePwaPlugin({
    serviceWorkerTemplate: path.join(__dirname, 'sw.js'),
  })
)

module.exports = webConfig
