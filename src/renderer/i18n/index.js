import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { createWebURL } from '../helpers/utils'
// List of locales approved for use
import activeLocales from '../../../static/locales/activeLocales.json'

Vue.use(VueI18n)

const i18n = new VueI18n({
  locale: 'en-US',
  fallbackLocale: { default: 'en-US' }
})

export async function loadLocale(locale) {
  // don't need to load it if it's already loaded
  if (i18n.availableLocales.includes(locale)) {
    return
  }
  if (!activeLocales.includes(locale)) {
    console.error(`Unable to load unknown locale: "${locale}"`)
  }

  // locales are only compressed in our production Electron builds
  if (process.env.IS_ELECTRON && process.env.NODE_ENV !== 'development') {
    const { readFile } = require('fs/promises')
    const { promisify } = require('util')
    const { brotliDecompress } = require('zlib')
    const brotliDecompressAsync = promisify(brotliDecompress)
    try {
      // decompress brotli compressed json file and then load it
      // eslint-disable-next-line n/no-path-concat
      const compressed = await readFile(`${__dirname}/static/locales/${locale}.json.br`)
      const decompressed = await brotliDecompressAsync(compressed)
      const data = JSON.parse(decompressed.toString())
      i18n.setLocaleMessage(locale, data)
    } catch (err) {
      console.error(locale, err)
    }
  } else {
    const url = createWebURL(`/static/locales/${locale}.json`)

    const response = await fetch(url)
    const data = await response.json()
    i18n.setLocaleMessage(locale, data)
  }
}

loadLocale('en-US')

export default i18n
