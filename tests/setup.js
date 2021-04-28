import Vue from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub'
import { faBitcoin } from '@fortawesome/free-brands-svg-icons/faBitcoin'
import { faMonero } from '@fortawesome/free-brands-svg-icons/faMonero'
import { faMastodon } from '@fortawesome/free-brands-svg-icons/faMastodon'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(fas, faGithub, faBitcoin, faMonero, faMastodon)

Vue.config.productionTip = false
Vue.config.devtools = false
Vue.component('FontAwesomeIcon', FontAwesomeIcon)
