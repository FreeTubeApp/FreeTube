const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const ProcessLocalesPlugin = require('./ProcessLocalesPlugin')

const isDevMode = process.env.NODE_ENV === 'development'

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
  // webpack spits out errors while inlining ytsr as
  // they dynamically import their package.json file to extract the bug report URL
  // the error: "Critical dependency: the request of a dependency is an expression"
  externals: ['ytsr'],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
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
          },
          {
            loader: 'css-loader',
            options: {
              esModule: false
            }
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
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: 'css-loader',
            options: {
              esModule: false
            }
          }
        ],
      },
      {
        test: /\.(png|jpe?g|gif|tif?f|bmp|webp|svg)(\?.*)?$/,
        type: 'asset/resource',
        generator: {
          filename: 'imgs/[name][ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]'
        }
      },
    ],
  },
  // webpack defaults to only optimising the production builds, so having this here is fine
  optimization: {
    minimizer: [
      '...', // extend webpack's list instead of overwriting it
      new CssMinimizerPlugin()
    ]
  },
  node: {
    __dirname: isDevMode,
    __filename: isDevMode
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.IS_ELECTRON': true
    }),
    new HtmlWebpackPlugin({
      excludeChunks: ['processTaskWorker'],
      filename: 'index.html',
      template: path.resolve(__dirname, '../src/index.ejs'),
      nodeModules: isDevMode
        ? path.resolve(__dirname, '../node_modules')
        : false,
    }),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: isDevMode ? '[name].css' : '[name].[contenthash].css',
      chunkFilename: isDevMode ? '[id].css' : '[id].[contenthash].css',
    }),
    // ignore linkedom's unnecessary broken canvas import, as youtubei.js only uses linkedom to generate DASH manifests
    new webpack.IgnorePlugin({
      resourceRegExp: /^canvas$/
    })
  ],
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.common.js',

      // defaults to the prebundled browser version which causes webpack to error with:
      // "Critical dependency: require function is used in a way in which dependencies cannot be statically extracted"
      // webpack likes to bundle the dependencies itself, could really have a better error message though
      'youtubei.js$': 'youtubei.js/dist/browser.js',
    },
    extensions: ['.js', '.vue']
  },
  target: 'electron-renderer',
}

/**
 * Adjust rendererConfig for production settings
 */
if (!isDevMode) {
  const processLocalesPlugin = new ProcessLocalesPlugin({
    compress: true,
    inputDir: path.join(__dirname, '../static/locales'),
    outputDir: 'static/locales',
  })

  config.plugins.push(
    processLocalesPlugin,
    new webpack.DefinePlugin({
      'process.env.LOCALE_NAMES': JSON.stringify(processLocalesPlugin.localeNames)
    })
  )
}

module.exports = config
