import { createI18n } from 'vue-i18n'
import { createWebURL } from '../helpers/utils'
// List of locales approved for use
import activeLocales from '../../../static/locales/activeLocales.json'

const i18n = createI18n({
  locale: 'en-US',
  legacy: true,
  fallbackLocale: {
    // https://vue-i18n.intlify.dev/guide/essentials/fallback.html

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
  if (i18n.global.availableLocales.includes(locale) &&
    Object.keys(i18n.global.messages[locale]).length > 0) {
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
  i18n.global.setLocaleMessage(locale, data)
}

// Set by _scripts/ProcessLocalesPlugin.js
if (process.env.HOT_RELOAD_LOCALES) {
  const websocket = new WebSocket('ws://localhost:9080/ws')

  websocket.onmessage = (event) => {
    const message = JSON.parse(event.data)

    if (message.type === 'freetube-locale-update') {
      for (const [locale, data] of message.data) {
        // Only update locale data if it was already loaded
        if (i18n.global.availableLocales.includes(locale) &&
          Object.keys(i18n.global.messages[locale]).length > 0) {
          const localeData = JSON.parse(data)

          i18n.global.setLocaleMessage(locale, localeData)
        }
      }
    }
  }
}

export default i18n
