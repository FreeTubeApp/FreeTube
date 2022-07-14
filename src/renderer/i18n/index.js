import Vue from 'vue'
import VueI18n from 'vue-i18n'
import yaml from 'js-yaml'
import fs from 'fs'

const isDev = process.env.NODE_ENV === 'development'

Vue.use(VueI18n)

// List of locales approved for use
const activeLocales = ['en-US', 'en_GB', 'ar', 'bg', 'ca', 'cs', 'da', 'de-DE', 'el', 'es', 'es_AR', 'es-MX', 'et', 'eu', 'fi', 'fr-FR', 'gl', 'he', 'hu', 'hr', 'id', 'is', 'it', 'ja', 'ko', 'lt', 'nb_NO', 'nl', 'nn', 'pl', 'pt', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv', 'tr', 'uk', 'vi', 'zh-CN', 'zh-TW']
const messages = {}
/* eslint-disable-next-line */
const fileLocation = isDev ? 'static/locales/' : `${__dirname}/static/locales/`

// Take active locales and load respective YAML file
activeLocales.forEach((locale) => {
  try {
    // File location when running in dev
    const doc = yaml.load(fs.readFileSync(`${fileLocation}${locale}.yaml`))
    messages[locale] = doc
  } catch (e) {
    console.log(e)
  }
})

export default new VueI18n({
  locale: 'en-US',
  fallbackLocale: { default: 'en-US' },
  messages: messages
})
