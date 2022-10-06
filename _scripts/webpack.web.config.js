const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const JsonMinimizerPlugin = require('json-minimizer-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const ProcessLocalesPlugin = require('./ProcessLocalesPlugin')

const { productName } = require('../package.json')

const isDevMode = process.env.NODE_ENV === 'development'

const config = {
  name: 'web',
  mode: process.env.NODE_ENV,
  devtool: isDevMode ? 'eval-cheap-module-source-map' : false,
  entry: {
    web: path.join(__dirname, '../src/renderer/main.js'),
  },
  output: {
    path: path.join(__dirname, '../dist/web'),
    filename: '[name].js',
  },
  externals: {
    electron: '{}'
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
        test: /\.html$/,
        use: 'vue-html-loader',
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
      new JsonMinimizerPlugin({
        exclude: /\/locales\/.*\.json/
      }),
      new CssMinimizerPlugin()
    ]
  },
  node: {
    __dirname: true,
    __filename: isDevMode,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PRODUCT_NAME': JSON.stringify(productName),
      'process.env.IS_ELECTRON': false
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new HtmlWebpackPlugin({
      excludeChunks: ['processTaskWorker'],
      filename: 'index.html',
      template: path.resolve(__dirname, '../src/index.ejs'),
      nodeModules: false,
    }),
    new VueLoaderPlugin(),
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
    fallback: {
      buffer: require.resolve('buffer/'),
      dns: require.resolve('browserify/lib/_empty.js'),
      fs: require.resolve('browserify/lib/_empty.js'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      net: require.resolve('browserify/lib/_empty.js'),
      os: require.resolve('os-browserify/browser.js'),
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
      timers: require.resolve('timers-browserify'),
      tls: require.resolve('browserify/lib/_empty.js'),
      vm: require.resolve('vm-browserify')
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
  const processLocalesPlugin = new ProcessLocalesPlugin({
    compress: false,
    inputDir: path.join(__dirname, '../static/locales'),
    outputDir: 'static/locales',
  })

  config.plugins.push(
    processLocalesPlugin,
    new webpack.DefinePlugin({
      'process.env.LOCALE_NAMES': JSON.stringify(processLocalesPlugin.localeNames)
    }),
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
              ignore: ['**/.*', '**/locales/**', '**/pwabuilder-sw.js', '**/dashFiles/**', '**/storyboards/**'],
            },
          },
      ]
    }),
    // webpack doesn't get rid of js-yaml even though it isn't used in the production builds
    // so we need to manually tell it to ignore any imports for `js-yaml`
    new webpack.IgnorePlugin({
      resourceRegExp: /^js-yaml$/,
      contextRegExp: /i18n$/
    })
  )
}

module.exports = config
