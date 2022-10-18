const { existsSync, readFileSync } = require('fs')
const { brotliCompressSync, constants } = require('zlib')
const { load: loadYaml } = require('js-yaml')

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
            promises.push(new Promise((resolve) => {
              if (Object.prototype.hasOwnProperty.call(data, 'Locale Name')) {
                delete data['Locale Name']
              }

              let filename = `${this.outputDir}/${locale}.json`
              let output = JSON.stringify(data)

              if (this.compress) {
                filename += '.br'
                output = this.compressLocale(output)
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

  compressLocale(data) {
    const buffer = Buffer.from(data, 'utf-8')

    return brotliCompressSync(buffer, {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        [constants.BROTLI_PARAM_SIZE_HINT]: buffer.byteLength
      }
    })
  }
}

module.exports = ProcessLocalesPlugin
