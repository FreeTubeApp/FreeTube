// import the styles
import Vue from 'vue'
import App from './App.vue'
import router from './router/index'
import store from './store/index'
import i18n from './i18n/index'
import { library } from '@fortawesome/fontawesome-svg-core'
// Please keep the list of constants sorted by name
// to avoid code conflict and duplicate entries
import {
  faAngleDown,
  faAngleUp,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faBars,
  faBookmark,
  faCheck,
  faChevronRight,
  faCircleUser,
  faClone,
  faComment,
  faCommentDots,
  faCopy,
  faDownload,
  faEllipsisH,
  faEllipsisV,
  faEnvelope,
  faExchangeAlt,
  faExclamationCircle,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFileDownload,
  faFileVideo,
  faFilter,
  faFire,
  faGlobe,
  faHashtag,
  faHeart,
  faHistory,
  faInfoCircle,
  faLanguage,
  faList,
  faNewspaper,
  faPause,
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
  faSquareCheck,
  faStar,
  faStepBackward,
  faStepForward,
  faSync,
  faThumbsDown,
  faThumbsUp,
  faThumbtack,
  faTimes,
  faTimesCircle,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import {
  faBitcoin,
  faGithub,
  faMastodon,
  faMonero
} from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

Vue.config.devtools = process.env.NODE_ENV === 'development'
Vue.config.performance = process.env.NODE_ENV === 'development'
Vue.config.productionTip = process.env.NODE_ENV === 'development'

// Please keep the list of constants sorted by name
// to avoid code conflict and duplicate entries
library.add(
  // solid icons
  faAngleDown,
  faAngleUp,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faBars,
  faBookmark,
  faCheck,
  faChevronRight,
  faCircleUser,
  faClone,
  faComment,
  faCommentDots,
  faCopy,
  faDownload,
  faEllipsisH,
  faEllipsisV,
  faEnvelope,
  faExchangeAlt,
  faExclamationCircle,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFileDownload,
  faFileVideo,
  faFilter,
  faFire,
  faGlobe,
  faHashtag,
  faHeart,
  faHistory,
  faInfoCircle,
  faLanguage,
  faList,
  faNewspaper,
  faPause,
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
  faSquareCheck,
  faStar,
  faStepBackward,
  faStepForward,
  faSync,
  faThumbsDown,
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

/* eslint-disable-next-line no-new */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: h => h(App)
})

// to avoid accessing electron api from web app build
if (process.env.IS_ELECTRON) {
  const { ipcRenderer } = require('electron')

  // handle menu event updates from main script
  ipcRenderer.on('change-view', (event, data) => {
    if (data.route) {
      router.push(data.route)
    }
  })
}
