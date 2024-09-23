import Vue from 'vue'
import VueI18n from 'vue-i18n'
import { createWebURL } from '../helpers/utils'
// List of locales approved for use
import activeLocales from '../../../static/locales/activeLocales.json'

Vue.use(VueI18n)

const i18n = new VueI18n({
  locale: 'en-US',
  fallbackLocale: {
    // https://kazupon.github.io/vue-i18n/guide/fallback.html#explicit-fallback-with-decision-maps

    // es-AR -> es -> en-US
    'es-AR': ['es'],
    // es-MX -> es -> en-US
    'es-MX': ['es'],
    // pt-BR -> pt -> en-US
    'pt-BR': ['pt'],
    // pt-PT -> pt -> en-US
    'pt-PT': ['pt'],
    // any -> en-US
    default: ['en-US'],
  }
})

export async function loadLocale(locale) {
  // don't need to load it if it's already loaded
  if (i18n.availableLocales.includes(locale)) {
    return
  }
  if (!activeLocales.includes(locale)) {
    console.error(`Unable to load unknown locale: "${locale}"`)
    return
  }

  let path

  // locales are only compressed in our production Electron builds
  if (process.env.IS_ELECTRON && process.env.NODE_ENV !== 'development') {
    path = `/static/locales/${locale}.json.br`
  } else {
    path = `/static/locales/${locale}.json`
  }

  const url = createWebURL(path)

  const response = await fetch(url)
  const data = await response.json()
  i18n.setLocaleMessage(locale, data)
}

// Set by _scripts/ProcessLocalesPlugin.js
if (process.env.HOT_RELOAD_LOCALES) {
  const websocket = new WebSocket('ws://localhost:9080/ws')

  websocket.onmessage = (event) => {
    const message = JSON.parse(event.data)

    if (message.type === 'freetube-locale-update') {
      for (const [locale, data] of message.data) {
        // Only update locale data if it was already loaded
        if (i18n.availableLocales.includes(locale)) {
          const localeData = JSON.parse(data)

          i18n.setLocaleMessage(locale, localeData)
        }
      }
    }
  }
}

export default i18n
