const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const JsonMinimizerPlugin = require('json-minimizer-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const ProcessLocalesPlugin = require('./ProcessLocalesPlugin')
const {
  SHAKA_LOCALE_MAPPINGS,
  SHAKA_LOCALES_PREBUNDLED,
  SHAKA_LOCALES_TO_BE_BUNDLED
} = require('./getShakaLocales')

const isDevMode = process.env.NODE_ENV === 'development'

const { version: swiperVersion } = JSON.parse(fs.readFileSync(path.join(__dirname, '../node_modules/swiper/package.json')))

/** @type {import('webpack').Configuration} */
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
    'youtubei.js': '{}'
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
        loader: 'vue-loader',
        options: {
          compilerOptions: {
            whitespace: 'condense',
          }
        }
      },
      {
        test: /\.scss$/,
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
              implementation: require('sass')
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
    generator: {
      json: {
        JSONParse: false
      }
    }
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
    __dirname: false,
    __filename: false
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.platform': 'undefined',
      'process.env.IS_ELECTRON': false,
      'process.env.IS_ELECTRON_MAIN': false,
      'process.env.SUPPORTS_LOCAL_API': false,
      'process.env.SWIPER_VERSION': `'${swiperVersion}'`
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),
    new HtmlWebpackPlugin({
      excludeChunks: ['processTaskWorker'],
      filename: 'index.html',
      template: path.resolve(__dirname, '../src/index.ejs')
    }),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: isDevMode ? '[name].css' : '[name].[contenthash].css',
      chunkFilename: isDevMode ? '[id].css' : '[id].[contenthash].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, '../node_modules/swiper/modules/{a11y,navigation,pagination}-element.css').replaceAll('\\', '/'),
          to: `swiper-${swiperVersion}.css`,
          context: path.join(__dirname, '../node_modules/swiper/modules'),
          transformAll: (assets) => {
            return Buffer.concat(assets.map(asset => asset.data))
          }
        }
      ]
    })
  ],
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.runtime.esm.js',
      'portal-vue$': 'portal-vue/dist/portal-vue.esm.js',

      DB_HANDLERS_ELECTRON_RENDERER_OR_WEB$: path.resolve(__dirname, '../src/datastores/handlers/web.js'),

      // change to "shaka-player.ui.debug.js" to get debug logs (update jsconfig to get updated types)
      'shaka-player$': 'shaka-player/dist/shaka-player.ui.js',
    },
    extensions: ['.js', '.vue']
  },
  target: 'web',
}

const processLocalesPlugin = new ProcessLocalesPlugin({
  compress: false,
  hotReload: isDevMode,
  inputDir: path.join(__dirname, '../static/locales'),
  outputDir: 'static/locales',
})

config.plugins.push(
  processLocalesPlugin,
  new webpack.DefinePlugin({
    'process.env.LOCALE_NAMES': JSON.stringify(processLocalesPlugin.localeNames),
    'process.env.GEOLOCATION_NAMES': JSON.stringify(fs.readdirSync(path.join(__dirname, '..', 'static', 'geolocations')).map(filename => filename.replace('.json', ''))),
    'process.env.SHAKA_LOCALE_MAPPINGS': JSON.stringify(SHAKA_LOCALE_MAPPINGS),
    'process.env.SHAKA_LOCALES_PREBUNDLED': JSON.stringify(SHAKA_LOCALES_PREBUNDLED)
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
      {
        from: path.join(__dirname, '../node_modules/shaka-player/ui/locales', `{${SHAKA_LOCALES_TO_BE_BUNDLED.join(',')}}.json`).replaceAll('\\', '/'),
        to: path.join(__dirname, '../dist/web/static/shaka-player-locales'),
        context: path.join(__dirname, '../node_modules/shaka-player/ui/locales')
      }
    ]
  })
)

module.exports = config
