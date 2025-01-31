const path = require('path')

/** @type {import('webpack').Configuration} */
module.exports = {
  name: 'botGuardScript',
  // Always use production mode, as we use the output as a function body and the debug output doesn't work for that
  mode: 'production',
  devtool: false,
  target: 'web',
  entry: {
    botGuardScript: path.join(__dirname, '../src/botGuardScript.js'),
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '../dist'),
    library: {
      type: 'modern-module'
    }
  },
  experiments: {
    outputModule: true
  }
}
