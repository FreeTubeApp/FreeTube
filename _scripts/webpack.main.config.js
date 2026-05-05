const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const JsonMinimizerPlugin = require('json-minimizer-webpack-plugin')

const isDevMode = process.env.NODE_ENV === 'development'

/** @type {import('webpack').Configuration} */
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
    generator: {
      json: {
        JSONParse: false
      }
    }
  },
  resolve: {
    alias: {
      // electron-context-menu only needs mime-db for its "save as" feature.
      // As we only activate the save image and save as image features,
      // we can remove all other mimetypes, as they will never get used.
      // Which results in quite a significant reduction in file size.
      //
      // Only the extensions field is needed, see: https://github.com/kevva/ext-list/blob/v2.2.2/index.js
      'mime-db$': path.join(__dirname, 'image-extensions-only-mime-db.json')
    }
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
      'process.platform': `'${process.platform}'`,
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
            ignore: ['**/.*', '**/locales/**', '**/pwabuilder-sw.js', '**/manifest.json', '**/dashFiles/**', '**/storyboards/**'],
          },
        },
      ]
    })
  )
}

module.exports = config
