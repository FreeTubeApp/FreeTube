import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { createWebURL } from '../helpers/utils'
// List of locales approved for use
import activeLocales from '../../../static/locales/activeLocales.json'

class CustomVueI18n extends VueI18n {
  constructor(options) {
    super(options)
    this.allLocales = activeLocales
  }

  async loadLocale(locale) {
    // don't need to load it if it's already loaded
    if (this.availableLocales.includes(locale)) {
      return
    }
    if (!this.allLocales.includes(locale)) {
      console.error(`Unable to load unknown locale: "${locale}"`)
    }

    if (process.env.IS_ELECTRON && process.env.NODE_ENV !== 'development') {
      const { readFile } = require('fs/promises')
      const { promisify } = require('util')
      const { brotliDecompress } = require('zlib')
      const brotliDecompressAsync = promisify(brotliDecompress)
      // locales are only compressed in our production Electron builds
      try {
        // decompress brotli compressed json file and then load it
        // eslint-disable-next-line n/no-path-concat
        const compressed = await readFile(`${__dirname}/static/locales/${locale}.json.br`)
        const decompressed = await brotliDecompressAsync(compressed)
        const data = JSON.parse(decompressed.toString())
        this.setLocaleMessage(locale, data)
      } catch (err) {
        console.error(locale, err)
      }
    } else {
      const url = createWebURL(`/static/locales/${locale}.json`)

      const response = await fetch(url)
      const data = await response.json()
      this.setLocaleMessage(locale, data)
    }
  }
}

Vue.use(CustomVueI18n)

const i18n = new CustomVueI18n({
  locale: 'en-US',
  fallbackLocale: { default: 'en-US' }
})

i18n.loadLocale('en-US')

export default i18n
