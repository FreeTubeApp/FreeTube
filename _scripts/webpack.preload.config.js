const path = require('path')

const isDevMode = process.env.NODE_ENV === 'development'

/** @type {import('webpack').Configuration} */
const config = {
  name: 'preload',
  mode: process.env.NODE_ENV,
  devtool: isDevMode ? 'eval-cheap-module-source-map' : false,
  entry: {
    preload: path.join(__dirname, '../src/preload/main.js'),
  },
  infrastructureLogging: {
    // Only warnings and errors
    // level: 'none' disable logging
    // Please read https://webpack.js.org/configuration/other-options/#infrastructurelogginglevel
    level: isDevMode ? 'info' : 'none'
  },
  output: {
    path: path.join(__dirname, '../dist'),
    filename: '[name].js'
  },
  externals: [
    'electron/renderer'
  ],
  externalsType: 'commonjs',
  node: {
    __dirname: false,
    __filename: false
  },
  target: 'electron-preload',
}

module.exports = config
