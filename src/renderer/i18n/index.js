import { createI18n } from 'vue-i18n'
import { createWebURL } from '../helpers/utils'
// List of locales approved for use
import activeLocales from '../../../static/locales/activeLocales.json'

const i18n = createI18n({
  locale: 'en-US',
  fallbackLocale: {
    // https://kazupon.github.io/vue-i18n/guide/fallback.html#explicit-fallback-with-decision-maps

    // es_AR -> es -> en-US
    es_AR: ['es'],
    // es-MX -> es -> en-US
    'es-MX': ['es'],
    // pt-BR -> pt -> en-US
    'pt-BR': ['pt'],
    // pt-PT -> pt -> en-US
    'pt-PT': ['pt'],
    // any -> en-US
    default: ['en-US'],
  },
  globalInjection: true,
  legacy: true,
})

export async function loadLocale(locale) {
  // don't need to load it if it's already loaded
  if (i18n.global.availableLocales.includes(locale) &&
      Object.keys(i18n.global.messages[locale]).length !== 0) {
    return
  }
  if (!activeLocales.includes(locale)) {
    console.error(`Unable to load unknown locale: "${locale}"`)
    return
  }

  // locales are only compressed in our production Electron builds
  let data
  if (process.env.IS_ELECTRON && process.env.NODE_ENV !== 'development') {
    const { promisify } = require('util')
    const { brotliDecompress } = require('zlib')
    const brotliDecompressAsync = promisify(brotliDecompress)
    try {
      // decompress brotli compressed json file and then load it
      const url = createWebURL(`/static/locales/${locale}.json.br`)
      const compressed = await (await fetch(url)).arrayBuffer()

      const decompressed = await brotliDecompressAsync(compressed)
      data = JSON.parse(decompressed.toString())
      i18n.global.setLocaleMessage(locale, data)
    } catch (err) {
      console.error(locale, err)
    }
  } else {
    const url = createWebURL(`/static/locales/${locale}.json`)

    const response = await fetch(url)
    data = await response.json()
    i18n.global.setLocaleMessage(locale, data)
  }
}

export default i18n
