// import the styles
import { createApp } from 'vue'
import App from './App.vue'
import i18n, { loadLocale } from './i18n/index'
import router from './router/index'
import store from './store/index'
import { library } from '@fortawesome/fontawesome-svg-core'

import { ObserveVisibility } from 'vue-observe-visibility'
import { register as registerSwiper } from 'swiper/element'

// Please keep the list of constants sorted by name
// to avoid code conflict and duplicate entries
import {
  faAngleDown,
  faAngleUp,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
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
  faEdit,
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
  faPlus,
  faQuestionCircle,
  faRandom,
  faRetweet,
  faRss,
  faSatelliteDish,
  faSave,
  faSearch,
  faShareAlt,
  faSlidersH,
  faSortDown,
  faStar,
  faStepBackward,
  faStepForward,
  faSync,
  faThumbsDown,
  faThumbsUp,
  faThumbtack,
  faTimes,
  faTimesCircle,
  faTrash,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import {
  faBitcoin,
  faGithub,
  faMastodon,
  faMonero
} from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Please keep the list of constants sorted by name
// to avoid code conflict and duplicate entries
library.add(
  // solid icons
  faAngleDown,
  faAngleUp,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
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
  faEdit,
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
  faPlus,
  faQuestionCircle,
  faRandom,
  faRetweet,
  faRss,
  faSatelliteDish,
  faSave,
  faSearch,
  faShareAlt,
  faSlidersH,
  faSortDown,
  faStar,
  faStepBackward,
  faStepForward,
  faSync,
  faThumbsDown,
  faThumbsUp,
  faThumbtack,
  faTimes,
  faTimesCircle,
  faTrash,
  faUsers,

  // brand icons
  faGithub,
  faBitcoin,
  faMastodon,
  faMonero
)

registerSwiper()

loadLocale('en-US').then(() => {
  const app = createApp(App)

  app.use(router)
  app.use(store)
  app.use(i18n)

  app.config.devtools = process.env.NODE_ENV === 'development'
  app.config.performance = process.env.NODE_ENV === 'development'
  app.config.productionTip = process.env.NODE_ENV === 'development'

  app.component('FontAwesomeIcon', FontAwesomeIcon)
  app.directive('observe-visibility', ObserveVisibility)
  // to avoid accessing electron api from web app build
  if (process.env.IS_ELECTRON) {
    const { ipcRenderer } = require('electron')

    // handle menu event updates from main script
    ipcRenderer.on('change-view', (event, data) => {
      if (data.route) {
        router.isReady().then(() =>
          router.push(data.route)
        )
      }
    })
  }
  router.isReady().then(() => app.mount('#app'))
})
