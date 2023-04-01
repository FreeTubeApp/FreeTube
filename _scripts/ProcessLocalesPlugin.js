const { existsSync, readFileSync } = require('fs')
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

    this.localeNames = []

    this.loadLocales()
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap('ProcessLocalesPlugin', (compilation) => {

      const { RawSource } = compiler.webpack.sources;

      compilation.hooks.processAssets.tapPromise({
        name: 'process-locales-plugin',
        stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
      },
        async (_assets) => {
          const promises = []

          for (const { locale, data } of this.locales) {
            promises.push(new Promise(async (resolve) => {
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

              compilation.emitAsset(
                filename,
                new RawSource(output),
                { minimized: true }
              )

              resolve()
            }))
          }

          await Promise.all(promises)
        })
    })
  }

  loadLocales() {
    this.locales = []

    const activeLocales = JSON.parse(readFileSync(`${this.inputDir}/activeLocales.json`))

    for (const locale of activeLocales) {
      const contents = readFileSync(`${this.inputDir}/${locale}.yaml`, 'utf-8')
      const data = loadYaml(contents)

      this.localeNames.push(data['Locale Name'] ?? locale)
      this.locales.push({ locale, data })
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
