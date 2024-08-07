import { set as vueSet } from 'vue'
import { createWebURL } from '../../helpers/utils'

// replace with a Map after the Vue 3 and Pinia migrations
const state = {
  cachedPlayerLocales: {}
}

const getters = {}

const actions = {
  async cachePlayerLocale({ commit }, locale) {
    const url = createWebURL(`/static/shaka-player-locales/${locale}.json`)

    const response = await fetch(url)
    const data = await response.json()

    Object.freeze(data)

    commit('addPlayerLocaleToCache', { locale, data })
  }
}

const mutations = {
  addPlayerLocaleToCache(state, { locale, data }) {
    vueSet(state.cachedPlayerLocales, locale, data)
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
