// import the styles
import Vue from 'vue'
import App from './App.vue'
import router from './router/index'
import store from './store/index'
import i18n from './i18n/index'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faAngleDown,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faBars,
  faBookmark,
  faCheck,
  faClone,
  faCommentDots,
  faCopy,
  faDownload,
  faEllipsisH,
  faEllipsisV,
  faEnvelope,
  faExchangeAlt,
  faExclamationCircle,
  faExternalLinkAlt,
  faFileDownload,
  faFileVideo,
  faFilter,
  faFire,
  faGlobe,
  faHeart,
  faHistory,
  faInfoCircle,
  faLanguage,
  faList,
  faNewspaper,
  faPlay,
  faQuestionCircle,
  faRandom,
  faRetweet,
  faRss,
  faSatelliteDish,
  faSearch,
  faShareAlt,
  faSlidersH,
  faSortDown,
  faStar,
  faStepBackward,
  faStepForward,
  faSync,
  faThumbsUp,
  faThumbtack,
  faTimes,
  faTimesCircle,
  faUsers
} from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub'
import { faBitcoin } from '@fortawesome/free-brands-svg-icons/faBitcoin'
import { faMonero } from '@fortawesome/free-brands-svg-icons/faMonero'
import { faMastodon } from '@fortawesome/free-brands-svg-icons/faMastodon'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const isDev = process.env.NODE_ENV === 'development'

Vue.config.devtools = isDev
Vue.config.performance = isDev
Vue.config.productionTip = isDev

library.add(
  // solid icons
  faAngleDown,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faBars,
  faBookmark,
  faCheck,
  faClone,
  faCommentDots,
  faCopy,
  faDownload,
  faEllipsisH,
  faEllipsisV,
  faEnvelope,
  faExchangeAlt,
  faExclamationCircle,
  faExternalLinkAlt,
  faFileDownload,
  faFileVideo,
  faFilter,
  faFire,
  faGlobe,
  faHeart,
  faHistory,
  faInfoCircle,
  faLanguage,
  faList,
  faNewspaper,
  faPlay,
  faQuestionCircle,
  faRandom,
  faRetweet,
  faRss,
  faSatelliteDish,
  faSearch,
  faShareAlt,
  faSlidersH,
  faSortDown,
  faStar,
  faStepBackward,
  faStepForward,
  faSync,
  faThumbsUp,
  faThumbtack,
  faTimes,
  faTimesCircle,
  faUsers,

  // brand icons
  faGithub,
  faBitcoin,
  faMastodon,
  faMonero
)

Vue.component('FontAwesomeIcon', FontAwesomeIcon)

/* eslint-disable-next-line */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: h => h(App)
})

// to avoid accessing electron api from web app build
if (window && window.process && window.process.type === 'renderer') {
  const { ipcRenderer } = require('electron')

  // handle menu event updates from main script
  ipcRenderer.on('change-view', (event, data) => {
    if (data.route) {
      router.push(data.route)
    }
  })
}
