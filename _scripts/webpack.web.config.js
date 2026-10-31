const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const MinimizerPlugin = require('minimizer-webpack-plugin')
const ProcessLocalesPlugin = require('./ProcessLocalesPlugin')
const {
  SHAKA_LOCALE_MAPPINGS,
  SHAKA_LOCALES_PREBUNDLED,
  SHAKA_LOCALES_TO_BE_BUNDLED
} = require('./getShakaLocales')

const isDevMode = process.env.NODE_ENV === 'development'

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
    copy: [
      {
        from: 'static/pwabuilder-sw.js',
        to: '.'
      },
      ...(isDevMode
        ? []
        : [
            {
              from: 'static',
              to: 'static',
              globOptions: {
                ignore: [
                  '**/.*',
                  'static/{locales,pwabuilder-sw.js}'
                ]
              }
            },
            {
              context: path.dirname(require.resolve('shaka-player/ui/locales/en.json')),
              from: `{${SHAKA_LOCALES_TO_BE_BUNDLED.join(',')}}.json`,
              to: 'static/shaka-player-locales',
              transform: (input) => {
                return JSON.stringify(JSON.parse(input.toString('utf-8')))
              }
            }
          ]
      ),
    ]
  },
  externals: {
    'youtubei.js': '{}',
    googlevideo: '{}'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          compilerOptions: {
            isCustomElement: (tag) => tag === 'swiper-container' || tag === 'swiper-slide',
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
        oneOf: [
          {
            test: /[/\\]swiper[/\\]/,
            type: 'asset/resource',
            generator: {
              filename: 'swiper-[name].[contenthash][ext]'
            }
          },
          {
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
            rules: [
              {
                resource: require.resolve('shaka-player/dist/controls.css'),
                use: path.join(__dirname, 'patch-shaka-player-loader.js')
              }
            ],
          },
        ]
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
      new MinimizerPlugin({
        test: /\.(?:css|js|json)(\?.*)?$/i,
        minify: [
          {
            implementation: MinimizerPlugin.cssnanoMinify
          },
          {
            implementation: MinimizerPlugin.jsonMinify
          },
          {
            implementation: MinimizerPlugin.terserMinify,
            options: {
              compress: {
                // webpack sets passes to 2 in its default minimizer config too
                passes: 2
              }
            }
          }
        ]
      })
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
      __VUE_OPTIONS_API__: 'true',
      __VUE_PROD_DEVTOOLS__: 'false',
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      __VUE_I18N_LEGACY_API__: 'false',
      __VUE_I18N_FULL_INSTALL__: 'false',
      __INTLIFY_PROD_DEVTOOLS__: 'false',
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser.js'
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
  ],
  resolve: {
    alias: {
      DB_HANDLERS_ELECTRON_RENDERER_OR_WEB$: path.resolve(__dirname, '../src/datastores/handlers/web.js'),

      // change to "shaka-player.ui-es2021.debug.js" to get debug logs (update jsconfig to get updated types)
      'shaka-player$': 'shaka-player/dist/shaka-player.ui-es2021.js',

      // Make @fortawesome/vue-fontawesome use the trimmed down API instead of the original @fortawesome/fontawesome-svg-core
      '@fortawesome/fontawesome-svg-core$': path.resolve(__dirname, '../src/renderer/fontawesome-minimal.js')
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
)

module.exports = config
