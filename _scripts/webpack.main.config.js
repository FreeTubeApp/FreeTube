const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const JsonMinimizerPlugin = require('json-minimizer-webpack-plugin')

const isDevMode = process.env.NODE_ENV === 'development'

const config = {
  name: 'main',
  mode: process.env.NODE_ENV,
  devtool: isDevMode ? 'eval-cheap-module-source-map' : false,
  entry: {
    main: path.join(__dirname, '../src/main/index.js'),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  // webpack defaults to only optimising the production builds, so having this here is fine
  optimization: {
    minimizer: [
      '...', // extend webpack's list instead of overwriting it
      new JsonMinimizerPlugin({
        exclude: /\/locales\/.*\.json/
      })
    ]
  },
  node: {
    __dirname: isDevMode,
    __filename: isDevMode
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.IS_ELECTRON_MAIN': true
    })
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist'),
  },
  target: 'electron-main',
}

if (!isDevMode) {
  config.plugins.push(
    new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(__dirname, '../static'),
            to: path.join(__dirname, '../dist/static'),
            globOptions: {
              dot: true,
              ignore: ['**/.*', '**/locales/**', '**/pwabuilder-sw.js', '**/dashFiles/**', '**/storyboards/**'],
            },
          },
      ]
    })
  )
}

module.exports = config
