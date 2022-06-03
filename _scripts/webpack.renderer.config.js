const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const {
  dependencies,
  devDependencies,
  productName,
} = require('../package.json')

const externals = Object.keys(dependencies).concat(Object.keys(devDependencies))
const isDevMode = process.env.NODE_ENV === 'development'
const whiteListedModules = ['vue']

const config = {
  name: 'renderer',
  mode: process.env.NODE_ENV,
  devtool: isDevMode ? 'eval-cheap-module-source-map' : false,
  entry: {
    renderer: path.join(__dirname, '../src/renderer/main.js'),
  },
  infrastructureLogging: {
    // Only warnings and errors
    // level: 'none' disable logging
    // Please read https://webpack.js.org/configuration/other-options/#infrastructurelogginglevel
    level: isDevMode ? 'info' : 'none'
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '../dist'),
    filename: '[name].js',
  },
  externals: externals.filter(d => !whiteListedModules.includes(d)),
  module: {
    rules: [
      {
        test: /\.(j|t)s$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.node$/,
        loader: 'node-loader',
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.s(c|a)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
            options: {
              // eslint-disable-next-line
              implementation: require('sass'),
              sassOptions: {
                indentedSyntax: true
              }
            }
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {},
          },
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|tif?f|bmp|webp|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            esModule: false,
            limit: 10000,
            name: 'imgs/[name]--[folder].[ext]',
          },
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            esModule: false,
            limit: 10000,
            name: 'fonts/[name]--[folder].[ext]',
          },
        },
      },
    ],
  },
  node: {
    __dirname: isDevMode,
    __filename: isDevMode,
    global: isDevMode,
  },
  plugins: [
    // new WriteFilePlugin(),
    new HtmlWebpackPlugin({
      excludeChunks: ['processTaskWorker'],
      filename: 'index.html',
      template: path.resolve(__dirname, '../src/index.ejs'),
      nodeModules: isDevMode
        ? path.resolve(__dirname, '../node_modules')
        : false,
    }),
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      'process.env.PRODUCT_NAME': JSON.stringify(productName),
    }),
    new MiniCssExtractPlugin({
      filename: isDevMode ? '[name].css' : '[name].[contenthash].css',
      chunkFilename: isDevMode ? '[id].css' : '[id].[contenthash].css',
    }),
  ],
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.common.js',
      '@': path.join(__dirname, '../src/'),
      src: path.join(__dirname, '../src/'),
      icons: path.join(__dirname, '../_icons/'),
      images: path.join(__dirname, '../src/renderer/assets/img/'),
      static: path.join(__dirname, '../static/'),
    },
    extensions: ['.js', '.vue', '.json'],
  },
  target: 'electron-renderer',
}

/**
 * Adjust rendererConfig for production settings
 */
if (isDevMode) {
  // any dev only config
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
            from: path.join(__dirname, '../static/pwabuilder-sw.js'),
            to: path.join(__dirname, '../dist/web/pwabuilder-sw.js'),
          },
          {
            from: path.join(__dirname, '../static'),
            to: path.join(__dirname, '../dist/web/static'),
            globOptions: {
              ignore: ['.*', 'pwabuilder-sw.js'],
            },
          },
          {
            from: path.join(__dirname, '../static'),
            to: path.join(__dirname, '../dist/static'),
            globOptions: {
              ignore: ['.*', 'pwabuilder-sw.js'],
            },
          },
          {
            from: path.join(__dirname, '../_icons'),
            to: path.join(__dirname, '../dist/web/_icons'),
            globOptions: {
              ignore: ['.*'],
            },
          },
          {
            from: path.join(__dirname, '../src/renderer/assets/img'),
            to: path.join(__dirname, '../dist/web/images'),
            globOptions: {
              ignore: ['.*'],
            },
          },
        ]
      }
    ),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
    })
  )
}

module.exports = config
