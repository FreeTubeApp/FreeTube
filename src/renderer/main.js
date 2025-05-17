// import the styles
import Vue from 'vue'
import i18n from './i18n/index'
import router from './router/index'
import store from './store/index'
import App from './App.vue'
import { library } from '@fortawesome/fontawesome-svg-core'

import { register as registerSwiper } from 'swiper/element'

import { ObserveVisibility } from 'vue-observe-visibility'

// Please keep the list of constants sorted by name
// to avoid code conflict and duplicate entries
import {
  faAngleDown,
  faAngleLeft,
  faAngleUp,
  faArrowDown,
  faArrowDownShortWide,
  faArrowDownWideShort,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faBars,
  faBarsProgress,
  faBorderAll,
  faBookmark,
  faCheck,
  faChevronRight,
  faCircleExclamation,
  faCirclePlay,
  faCircleUser,
  faClapperboard,
  faClock,
  faClockRotateLeft,
  faClone,
  faComment,
  faCommentDots,
  faCopy,
  faDatabase,
  faDisplay,
  faDownload,
  faEdit,
  faEllipsisH,
  faEllipsisV,
  faEnvelope,
  faExchangeAlt,
  faExclamationCircle,
  faExpand,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFileDownload,
  faFileImage,
  faFileVideo,
  faFilm,
  faFilter,
  faFlask,
  faFire,
  faForward,
  faGamepad,
  faGauge,
  faGlobe,
  faGrip,
  faHashtag,
  faHeart,
  faHistory,
  faImages,
  faInfoCircle,
  faKey,
  faKeyboard,
  faLanguage,
  faLink,
  faLinkSlash,
  faList,
  faLocationDot,
  faLock,
  faMessage,
  faMoneyCheckDollar,
  faMusic,
  faNetworkWired,
  faNewspaper,
  faPalette,
  faPhotoFilm,
  faPlay,
  faPlus,
  faQuestionCircle,
  faRandom,
  faRetweet,
  faRss,
  faSatelliteDish,
  faSave,
  faSearch,
  faServer,
  faShareAlt,
  faShield,
  faSlash,
  faSlidersH,
  faSortAlphaDown,
  faSortAlphaDownAlt,
  faSortDown,
  faStepBackward,
  faStepForward,
  faSync,
  faThumbsDown,
  faThumbsUp,
  faThumbtack,
  faTimes,
  faTimesCircle,
  faTowerBroadcast,
  faTrash,
  faUserCheck,
  faUserLock,
  faUsers,
  faUsersSlash,
  faVideo,
  faVolumeHigh,
  faVolumeLow,
  faVolumeMute,
  faWifi,
  faXmark
} from '@fortawesome/free-solid-svg-icons'
import {
  faBookmark as farBookmark,
  faDotCircle as farDotCircle
} from '@fortawesome/free-regular-svg-icons'
import {
  faBitcoin,
  faGithub,
  faMastodon,
} from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome'
import PortalVue from 'portal-vue'

Vue.config.devtools = process.env.NODE_ENV === 'development'
Vue.config.performance = process.env.NODE_ENV === 'development'
Vue.config.productionTip = process.env.NODE_ENV === 'development'

// Please keep the list of constants sorted by name
// to avoid code conflict and duplicate entries
library.add(
  // solid icons
  faAngleDown,
  faAngleLeft,
  faAngleUp,
  faArrowDown,
  faArrowDownShortWide,
  faArrowDownWideShort,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faBars,
  faBarsProgress,
  faBorderAll,
  faBookmark,
  faCheck,
  faChevronRight,
  faCircleExclamation,
  faCirclePlay,
  faCircleUser,
  faClapperboard,
  faClock,
  faClockRotateLeft,
  faClone,
  faComment,
  faCommentDots,
  faCopy,
  faDatabase,
  faDisplay,
  faDownload,
  faEdit,
  faEllipsisH,
  faEllipsisV,
  faEnvelope,
  faExchangeAlt,
  faExclamationCircle,
  faExpand,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFileDownload,
  faFileImage,
  faFileVideo,
  faFilm,
  faFilter,
  faFlask,
  faFire,
  faForward,
  faGamepad,
  faGauge,
  faGlobe,
  faGrip,
  faHashtag,
  faHeart,
  faHistory,
  faImages,
  faInfoCircle,
  faKey,
  faKeyboard,
  faLanguage,
  faLink,
  faLinkSlash,
  faList,
  faLocationDot,
  faLock,
  faMessage,
  faMoneyCheckDollar,
  faMusic,
  faNetworkWired,
  faNewspaper,
  faPalette,
  faPhotoFilm,
  faPlay,
  faPlus,
  faQuestionCircle,
  faRandom,
  faRetweet,
  faRss,
  faSatelliteDish,
  faSave,
  faSearch,
  faServer,
  faShareAlt,
  faShield,
  faSlash,
  faSlidersH,
  faSortAlphaDown,
  faSortAlphaDownAlt,
  faSortDown,
  faStepBackward,
  faStepForward,
  faSync,
  faThumbsDown,
  faThumbsUp,
  faThumbtack,
  faTimes,
  faTimesCircle,
  faTowerBroadcast,
  faTrash,
  faUserCheck,
  faUserLock,
  faUsers,
  faUsersSlash,
  faVideo,
  faVolumeHigh,
  faVolumeLow,
  faVolumeMute,
  faWifi,
  faXmark,

  // solid icons
  farBookmark,
  farDotCircle,

  // brand icons
  faGithub,
  faBitcoin,
  faMastodon,
)

registerSwiper()

Vue.component('FontAwesomeIcon', FontAwesomeIcon)
Vue.component('FontAwesomeLayers', FontAwesomeLayers)
Vue.directive('observe-visibility', ObserveVisibility)

/* eslint-disable-next-line no-new */
new Vue({
  el: '#app',
  router,
  store,
  i18n,
  render: h => h(App)
})
Vue.use(PortalVue)

// to avoid accessing electron api from web app build
if (process.env.IS_ELECTRON) {
  window.ftElectron.handleChangeView((route) => {
    router.push(route)
  })
}
