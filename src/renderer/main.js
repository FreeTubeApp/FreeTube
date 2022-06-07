// import the styles
import Vue from 'vue'
import App from './App.vue'
import router from './router/index'
import store from './store/index'
import i18n from './i18n/index'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub'
import { faBitcoin } from '@fortawesome/free-brands-svg-icons/faBitcoin'
import { faMonero } from '@fortawesome/free-brands-svg-icons/faMonero'
import { faMastodon } from '@fortawesome/free-brands-svg-icons/faMastodon'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const isDev = process.env.NODE_ENV === 'development'

Vue.config.devtools = isDev
Vue.config.performance = isDev
Vue.config.productionTip = isDev

library.add(fas, faGithub, faBitcoin, faMonero, faMastodon)

Vue.component('FontAwesomeIcon', FontAwesomeIcon)

/* eslint-disable-next-line */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: h => h(App)
})

// to avoid accesing electron api from web app build
if (window && window.process && window.process.type === 'renderer') {
  const { ipcRenderer } = require('electron')

  // handle menu event updates from main script
  ipcRenderer.on('change-view', (event, data) => {
    if (data.route) {
      router.push(data.route)
    }
  })
}
