const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const { productName } = require('../package.json')

const isDevMode = process.env.NODE_ENV === 'development'

const config = {
  name: 'web',
  mode: process.env.NODE_ENV,
  devtool: isDevMode ? '#cheap-module-eval-source-map' : false,
  entry: {
    web: path.join(__dirname, '../src/renderer/main.js'),
  },
  output: {
    path: path.join(__dirname, '../dist/web'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          options: {
            extractCSS: true,
            loaders: {
              sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
              scss: 'vue-style-loader!css-loader!sass-loader',
              less: 'vue-style-loader!css-loader!less-loader',
            },
          },
        },
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
        test: /\.html$/,
        use: 'vue-html-loader',
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
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty',
    dns: 'empty'
  },
  plugins: [
    // new WriteFilePlugin(),
    new HtmlWebpackPlugin({
      excludeChunks: ['processTaskWorker'],
      filename: 'index.html',
      template: path.resolve(__dirname, '../src/index.ejs'),
      nodeModules: false,
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
      '@': path.join(__dirname, '../src/renderer'),
      vue$: 'vue/dist/vue.esm.js',
      src: path.join(__dirname, '../src/'),
      icons: path.join(__dirname, '../_icons/'),
      images: path.join(__dirname, '../src/renderer/assets/img/'),
      static: path.join(__dirname, '../static/'),
    },
    extensions: ['.js', '.vue', '.json', '.css'],
  },
  target: 'web',
}

/**
 * Adjust web for production settings
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
              dot: true,
              ignore: ['**/.*', '**/pwabuilder-sw.js', '**/dashFiles/**', '**/storyboards/**'],
            },
          },
          {
            from: path.join(__dirname, '../_icons'),
            to: path.join(__dirname, '../dist/web/_icons'),
            globOptions: {
              dot: true,
              ignore: ['**/.*'],
            },
          },
          {
            from: path.join(__dirname, '../src/renderer/assets/img'),
            to: path.join(__dirname, '../dist/web/images'),
            globOptions: {
              dot: true,
              ignore: ['**/.*'],
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
