import IsEqual from 'lodash.isequal'
import FtToastEvents from '../../components/ft-toast/ft-toast-events'
const state = {
  isSideNavOpen: false,
  sessionSearchHistory: [],
  popularCache: null,
  trendingCache: null,
  searchSettings: {
    sortBy: 'relevance',
    time: '',
    type: 'all',
    duration: ''
  },
  colorClasses: [
    'mainRed',
    'mainPink',
    'mainPurple',
    'mainDeepPurple',
    'mainIndigo',
    'mainBlue',
    'mainLightBlue',
    'mainCyan',
    'mainTeal',
    'mainGreen',
    'mainLightGreen',
    'mainLime',
    'mainYellow',
    'mainAmber',
    'mainOrange',
    'mainDeepOrange'
  ]
}

const getters = {
  getIsSideNavOpen () {
    return state.isSideNavOpen
  },

  getCurrentVolume () {
    return state.currentVolume
  },

  getSessionSearchHistory () {
    return state.sessionSearchHistory
  },

  getPopularCache () {
    return state.popularCache
  },

  getTrendingCache () {
    return state.trendingCache
  },

  getSearchSettings () {
    return state.searchSettings
  }
}

const actions = {
  getRandomColorClass () {
    const randomInt = Math.floor(Math.random() * state.colorClasses.length)
    return state.colorClasses[randomInt]
  },

  getVideoIdFromUrl (_, url) {
    /** @type {URL} */
    let urlObject
    try {
      urlObject = new URL(url)
    } catch (e) {
      return false
    }

    const extractors = [
      // anything with /watch?v=
      function() {
        if (urlObject.pathname === '/watch' && urlObject.searchParams.has('v')) {
          return urlObject.searchParams.get('v')
        }
      },
      // youtu.be
      function() {
        if (urlObject.host === 'youtu.be' && urlObject.pathname.match(/^\/[A-Za-z0-9_-]+$/)) {
          return urlObject.pathname.slice(1)
        }
      },
      // cloudtube
      function() {
        if (urlObject.host.match(/^cadence\.(gq|moe)$/) && urlObject.pathname.match(/^\/cloudtube\/video\/[A-Za-z0-9_-]+$/)) {
          return urlObject.pathname.slice('/cloudtube/video/'.length)
        }
      }
    ]

    return extractors.reduce((a, c) => a || c(), null) || false
  },

  showToast (_, payload) {
    FtToastEvents.$emit('toast.open', payload.message, payload.action, payload.time)
  }
}

const mutations = {
  toggleSideNav (state) {
    state.isSideNavOpen = !state.isSideNavOpen
  },

  setSessionSearchHistory (state, history) {
    state.sessionSearchHistory = history
  },

  addToSessionSearchHistory (state, payload) {
    const sameSearch = state.sessionSearchHistory.findIndex((search) => {
      return search.query === payload.query && IsEqual(payload.searchSettings, search.searchSettings)
    })

    if (sameSearch !== -1) {
      state.sessionSearchHistory[sameSearch].data = state.sessionSearchHistory[sameSearch].data.concat(payload.data)
      state.sessionSearchHistory[sameSearch].nextPageRef = payload.nextPageRef
    } else {
      state.sessionSearchHistory.push(payload)
    }
  },

  setPopularCache (state, value) {
    state.popularCache = value
  },

  setTrendingCache (state, value) {
    state.trendingCache = value
  },

  setSearchSortBy (state, value) {
    state.searchSettings.sortBy = value
  },

  setSearchTime (state, value) {
    state.searchSettings.time = value
  },

  setSearchType (state, value) {
    state.searchSettings.type = value
  },

  setSearchDuration (state, value) {
    state.searchSettings.duration = value
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
