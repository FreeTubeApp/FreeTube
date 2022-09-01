const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const {
  dependencies,
  devDependencies,
  productName,
} = require('../package.json')

const externals = Object.keys(dependencies).concat(Object.keys(devDependencies))
const isDevMode = process.env.NODE_ENV === 'development'
const whiteListedModules = []

const config = {
  name: 'main',
  mode: process.env.NODE_ENV,
  devtool: isDevMode ? 'eval-cheap-module-source-map' : false,
  entry: {
    main: path.join(__dirname, '../src/main/index.js'),
  },
  externals: externals.filter(d => !whiteListedModules.includes(d)),
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.node$/,
        loader: 'node-loader',
      },
    ],
  },
  node: {
    __dirname: isDevMode,
    __filename: isDevMode,
    global: isDevMode,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PRODUCT_NAME': JSON.stringify(productName),
    }),
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist'),
  },
  resolve: {
    extensions: ['.js', '.json'],
    alias: {
      '@': path.join(__dirname, '../src/'),
      src: path.join(__dirname, '../src/'),
    },
  },
  target: 'electron-main',
}

if (isDevMode) {
  config.plugins.push(
    new webpack.DefinePlugin({
      __static: `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`,
    })
  )
} else {
  config.plugins.push(
    new CopyWebpackPlugin({
        patterns: [
          {
            from: path.join(__dirname, '../static'),
            to: path.join(__dirname, '../dist/static'),
            globOptions: {
              dot: true,
              ignore: ['**/.*', '**/pwabuilder-sw.js', '**/dashFiles/**', '**/storyboards/**'],
            },
          },
          {
            from: path.join(__dirname, '../_icons'),
            to: path.join(__dirname, '../dist/_icons'),
            globOptions: {
              dot: true,
              ignore: ['**/.*'],
            },
          },
          {
            from: path.join(__dirname, '../src/renderer/assets/img'),
            to: path.join(__dirname, '../dist/images'),
            globOptions: {
              dot: true,
              ignore: ['**/.*'],
            },
          },
      ]
    })
  )
}

module.exports = config
