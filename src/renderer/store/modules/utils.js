import IsEqual from 'lodash.isequal'

const state = {
  isSideNavOpen: false,
  sessionSearchHistory: [],
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

  getSearchSettings () {
    return state.searchSettings
  }
}

const actions = {
  getRandomColorClass () {
    const randomInt = Math.floor(Math.random() * state.colorClasses.length)
    return state.colorClasses[randomInt]
  },

  getVideoIdFromUrl ({ state }, url) {
    console.log('checking for id')
    console.log(url)
    const rx = /^.*(?:(?:(you|hook)tu\.?be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/

    const match = url.match(rx)

    if (match) {
      return match[2]
    } else {
      return false
    }
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
