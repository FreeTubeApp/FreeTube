// import the styles
import Vue from 'vue'
import App from './App.vue'
import router from './router/index'
import store from './store/index'
// import 'material-design-icons/iconfont/material-icons.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub'
import { faBitcoin } from '@fortawesome/free-brands-svg-icons/faBitcoin'
import { faMonero } from '@fortawesome/free-brands-svg-icons/faMonero'
import { faMastodon } from '@fortawesome/free-brands-svg-icons/faMastodon'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import VueI18n from 'vue-i18n'
import yaml from 'js-yaml'
import fs from 'fs'

const isDev = process.env.NODE_ENV === 'development'

Vue.config.devtools = isDev
Vue.config.performance = isDev
Vue.config.productionTip = isDev

library.add(fas, faGithub, faBitcoin, faMonero, faMastodon)

Vue.component('FontAwesomeIcon', FontAwesomeIcon)
Vue.use(VueI18n)

// List of locales approved for use
const activeLocales = ['en-US', 'en_GB', 'ar', 'bg', 'cs', 'da', 'de-DE', 'el', 'es', 'es-MX', 'fi', 'fr-FR', 'gl', 'he', 'hu', 'hr', 'id', 'is', 'it', 'ja', 'nb_NO', 'nl', 'nn', 'pl', 'pt', 'pt-BR', 'pt-PT', 'ru', 'sk', 'sl', 'sv', 'tr', 'uk', 'vi', 'zh-CN', 'zh-TW']
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

const i18n = new VueI18n({
  locale: 'en-US', // set locale
  fallbackLocale: {
    default: 'en-US' // for the case systems locale has no corresponding .yaml file en-US gets set
  },
  messages // set locale messages
})

/* eslint-disable-next-line */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: h => h(App)
})

// to avoild accesing electorn api from web app build
if (window && window.process && window.process.type === 'renderer') {
  const { ipcRenderer } = require('electron')

  // handle menu event updates from main script
  ipcRenderer.on('change-view', (event, data) => {
    if (data.route) {
      router.push(data.route)
    }
  })
}
