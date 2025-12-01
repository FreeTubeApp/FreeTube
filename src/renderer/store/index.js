import { createStore } from 'vuex'
// import createPersistedState from 'vuex-persistedstate'

import history from './modules/history'
import invidious from './modules/invidious'
import player from './modules/player'
import playlists from './modules/playlists'
import profiles from './modules/profiles'
import searchHistory from './modules/search-history'
import settings from './modules/settings'
import subscriptionCache from './modules/subscription-cache'
import utils from './modules/utils'

export default createStore({
  modules: {
    history,
    invidious,
    playlists,
    profiles,
    settings,
    searchHistory,
    subscriptionCache,
    utils,
    player,
  },

  // Detects unsafe changes to the store state e.g. outside of mutations
  // but we have to turn it off despite its usefulness as we have so much data in the store
  // that it causes a noticeable slow-down :(
  strict: false

  // TODO: Enable when deploy
  // plugins: [createPersistedState()]
})
