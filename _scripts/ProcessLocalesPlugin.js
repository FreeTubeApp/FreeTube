const { existsSync, readFileSync, statSync } = require('fs')
const { brotliCompress, constants } = require('zlib')
const { promisify } = require('util')
const { load: loadYaml } = require('js-yaml')

const brotliCompressAsync = promisify(brotliCompress)

class ProcessLocalesPlugin {
  constructor(options = {}) {
    this.compress = !!options.compress

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

    this.locales = {}
    this.localeNames = []
    this.activeLocales = []

    this.cache = {}

    this.loadLocales()
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap('ProcessLocalesPlugin', (compilation) => {

      const IS_DEV_SERVER = !!compiler.watching
      const { CachedSource, RawSource } = compiler.webpack.sources;

      compilation.hooks.additionalAssets.tapPromise('process-locales-plugin', async (_assets) => {

        // While running in the webpack dev server, this hook gets called for every incremental build.
        // For incremental builds we can return the already processed versions, which saves time
        // and makes webpack treat them as cached
        const promises = []
        this.loadLocales(true)

        Object.values(this.locales).forEach((localeEntry) => {
          const { locale, data, mtimeMs } = localeEntry
          promises.push(new Promise(async (resolve) => {
            if (IS_DEV_SERVER) {
              const cacheEntry = this.cache[locale]
              if (cacheEntry != null) {
                const { filename, source, mtimeMs: cachedMtimeMs } = cacheEntry
                if (cachedMtimeMs === mtimeMs) {
                  compilation.emitAsset(filename, source, { minimized: true })
                  resolve()
                  return
                }
              }
            }

            if (Object.prototype.hasOwnProperty.call(data, 'Locale Name')) {
              delete data['Locale Name']
            }

            this.removeEmptyValues(data)

            let filename = `${this.outputDir}/${locale}.json`
            let output = JSON.stringify(data)

            if (this.compress) {
              filename += '.br'
              output = await this.compressLocale(output)
            }

            let source = new RawSource(output)

            if (IS_DEV_SERVER) {
              source = new CachedSource(source)
              this.cache[locale] = { filename, source, mtimeMs }
            }

            compilation.emitAsset(filename, source, { minimized: true })

            resolve()
          }))

          if (IS_DEV_SERVER) {
            // we don't need the unmodified sources anymore, as we use the cache `this.cache`
            // so we can clear this to free some memory
            delete localeEntry.data
          }
        })

        await Promise.all(promises)
      })
    })
  }

  loadLocales(loadModifiedFilesOnly = false) {
    if (this.activeLocales.length === 0) {
      this.activeLocales = JSON.parse(readFileSync(`${this.inputDir}/activeLocales.json`))
    }

    for (const locale of this.activeLocales) {
      const filePath = `${this.inputDir}/${locale}.yaml`
      // Cannot use `mtime` since values never equal
      const mtimeMsFromStats = statSync(filePath).mtimeMs
      if (loadModifiedFilesOnly) {
        // Skip reading files where mtime (modified time) same as last read
        // (stored in mtime)
        const existingMtime = this.locales[locale]?.mtimeMs
        if (existingMtime != null && existingMtime === mtimeMsFromStats) {
          continue
        }
      }
      const contents = readFileSync(filePath, 'utf-8')
      const data = loadYaml(contents)
      this.locales[locale] = { locale, data, mtimeMs: mtimeMsFromStats }

      const localeName = data['Locale Name'] ?? locale
      if (!this.localeNames.includes(localeName)) { this.localeNames.push(localeName) }
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
