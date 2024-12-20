const { existsSync, readFileSync } = require('fs')
const { readFile } = require('fs/promises')
const { join } = require('path')
const { brotliCompress, constants } = require('zlib')
const { promisify } = require('util')
const { load: loadYaml } = require('js-yaml')

const brotliCompressAsync = promisify(brotliCompress)

const PLUGIN_NAME = 'ProcessLocalesPlugin'

class ProcessLocalesPlugin {
  constructor(options = {}) {
    this.compress = !!options.compress
    this.hotReload = !!options.hotReload

    if (typeof options.inputDir !== 'string') {
      throw new Error('ProcessLocalesPlugin: no input directory `inputDir` specified.')
    } else if (!existsSync(options.inputDir)) {
      throw new Error('ProcessLocalesPlugin: the specified input directory does not exist.')
    }
    this.inputDir = options.inputDir

    if (typeof options.outputDir !== 'string') {
      throw new Error('ProcessLocalesPlugin: no output directory `outputDir` specified.')
    }
    this.outputDir = options.outputDir

    /** @type {Map<string, any>} */
    this.locales = new Map()
    this.localeNames = []

    /** @type {Map<string, any>} */
    this.cache = new Map()

    this.filePaths = []
    this.previousTimestamps = new Map()
    this.startTime = Date.now()

    /** @type {(updatedLocales: [string, string][]) => void|null} */
    this.notifyLocaleChange = null

    this.loadLocales()
  }

  /** @param {import('webpack').Compiler} compiler  */
  apply(compiler) {
    const { CachedSource, RawSource } = compiler.webpack.sources
    const { Compilation, DefinePlugin } = compiler.webpack

    new DefinePlugin({
      'process.env.HOT_RELOAD_LOCALES': this.hotReload
    }).apply(compiler)

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      const IS_DEV_SERVER = !!compiler.watching

      compilation.hooks.processAssets.tapPromise({
        name: PLUGIN_NAME,
        stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
      }, async (_assets) => {
        // While running in the webpack dev server, this hook gets called for every incremental build.
        // For incremental builds we can return the already processed versions, which saves time
        // and makes webpack treat them as cached
        const promises = []

        /** @type {[string, string][]} */
        const updatedLocales = []
        if (this.hotReload && !this.notifyLocaleChange) {
          console.warn('ProcessLocalesPlugin: Unable to live reload locales as `notifyLocaleChange` is not set.')
        }

        for (let [locale, data] of this.locales) {
          // eslint-disable-next-line no-async-promise-executor
          promises.push(new Promise(async (resolve) => {
            if (IS_DEV_SERVER && compiler.fileTimestamps) {
              const filePath = join(this.inputDir, `${locale}.yaml`)

              const timestamp = compiler.fileTimestamps.get(filePath)?.safeTime

              if (timestamp && timestamp > (this.previousTimestamps.get(locale) ?? this.startTime)) {
                this.previousTimestamps.set(locale, timestamp)

                const contents = await readFile(filePath, 'utf-8')
                data = loadYaml(contents)
              } else {
                const { filename, source } = this.cache.get(locale)
                compilation.emitAsset(filename, source, { minimized: true })
                resolve()
                return
              }
            }

            this.removeEmptyValues(data)

            let filename = `${this.outputDir}/${locale}.json`
            let output = JSON.stringify(data)

            if (this.hotReload && compiler.fileTimestamps) {
              updatedLocales.push([locale, output])
            }

            if (this.compress) {
              filename += '.br'
              output = await this.compressLocale(output)
            }

            let source = new RawSource(output)

            if (IS_DEV_SERVER) {
              source = new CachedSource(source)
              this.cache.set(locale, { filename, source })

              // we don't need the unmodified sources anymore, as we use the cache `this.cache`
              // so we can clear this to free some memory
              this.locales.set(locale, null)
            }

            compilation.emitAsset(filename, source, { minimized: true })

            resolve()
          }))
        }

        await Promise.all(promises)

        if (this.hotReload && this.notifyLocaleChange && updatedLocales.length > 0) {
          this.notifyLocaleChange(updatedLocales)
        }
      })
    })

    compiler.hooks.afterCompile.tap(PLUGIN_NAME, (compilation) => {
      // eslint-disable-next-line no-extra-boolean-cast
      if (!!compiler.watching) {
        // watch locale files for changes
        compilation.fileDependencies.addAll(this.filePaths)
      }
    })
  }

  loadLocales() {
    const activeLocales = JSON.parse(readFileSync(`${this.inputDir}/activeLocales.json`))

    for (const locale of activeLocales) {
      const filePath = join(this.inputDir, `${locale}.yaml`)

      this.filePaths.push(filePath)

      const contents = readFileSync(filePath, 'utf-8')
      const data = loadYaml(contents)
      this.locales.set(locale, data)

      this.localeNames.push(data['Locale Name'] ?? locale)
    }
  }

  async compressLocale(data) {
    const buffer = Buffer.from(data, 'utf-8')

    return await brotliCompressAsync(buffer, {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        [constants.BROTLI_PARAM_SIZE_HINT]: buffer.byteLength
      }
    })
  }

  /**
   * vue-i18n doesn't fallback if the translation is an empty string
   * so we want to get rid of them and also remove the empty objects that can get left behind
   * if we've removed all the keys and values in them
   * @param {object|string} data
   */
  removeEmptyValues(data) {
    for (const key of Object.keys(data)) {
      const value = data[key]
      if (typeof value === 'object') {
        this.removeEmptyValues(value)
      }

      if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
        delete data[key]
      }
    }
  }
}

module.exports = ProcessLocalesPlugin
