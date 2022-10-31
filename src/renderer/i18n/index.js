import Vue from 'vue'
import VueI18n from 'vue-i18n'
import fs from 'fs'
import { createWebURL } from '../helpers/utils'
// List of locales approved for use
import activeLocales from '../../../static/locales/activeLocales.json'

const isDev = process.env.NODE_ENV === 'development'

const messages = {}

if (isDev && process.env.IS_ELECTRON) {
  const { load } = require('js-yaml')

  // Take active locales and load respective YAML file
  activeLocales.forEach((locale) => {
    try {
      // File location when running in dev
      const doc = load(fs.readFileSync(`static/locales/${locale}.yaml`))
      messages[locale] = doc
    } catch (e) {
      console.error(locale, e)
    }
  })
}

class CustomVueI18n extends VueI18n {
  constructor(options) {
    super(options)
    this.allLocales = activeLocales
  }

  async loadLocale(locale) {
    // we don't lazy load locales in development in electron
    if (isDev && process.env.IS_ELECTRON) { return }
    // don't need to load it if it's already loaded
    if (this.availableLocales.includes(locale)) {
      return
    }
    if (!this.allLocales.includes(locale)) {
      console.error(`Unable to load unknown locale: "${locale}"`)
    }

    if (process.env.IS_ELECTRON) {
      const { brotliDecompressSync } = require('zlib')
      // locales are only compressed in our production Electron builds
      try {
        // decompress brotli compressed json file and then load it
        // eslint-disable-next-line node/no-path-concat
        const compressed = fs.readFileSync(`${__dirname}/static/locales/${locale}.json.br`)
        const data = JSON.parse(brotliDecompressSync(compressed).toString())
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
  fallbackLocale: { default: 'en-US' },
  messages
})

if (!isDev || !process.env.IS_ELECTRON) {
  i18n.loadLocale('en-US')
}

export default i18n
