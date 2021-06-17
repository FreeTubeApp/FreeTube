import { historyDb } from '../datastores'

const state = {
  historyCache: []
}

const getters = {
  getHistoryCache: () => {
    return state.historyCache
  }
}

const actions = {
  async grabHistory({ commit }) {
    const results = await historyDb.find({}).sort({ timeWatched: -1 })
    commit('setHistoryCache', results)
  },

  async updateHistory({ dispatch }, videoData) {
    await historyDb.update(
      { videoId: videoData.videoId },
      videoData,
      { upsert: true }
    )
    dispatch('grabHistory')
  },

  async removeFromHistory({ dispatch }, videoId) {
    await historyDb.remove({ videoId: videoId })
    dispatch('grabHistory')
  },

  async removeAllHistory({ dispatch }) {
    await historyDb.remove({}, { multi: true })
    dispatch('grabHistory')
  },

  async updateWatchProgress({ dispatch }, videoData) {
    await historyDb.update(
      { videoId: videoData.videoId },
      { $set: { watchProgress: videoData.watchProgress } },
      { upsert: true }
    )
    dispatch('grabHistory')
  },

  compactHistory(_) {
    historyDb.persistence.compactDatafile()
  }
}

const mutations = {
  setHistoryCache(state, historyCache) {
    state.historyCache = historyCache
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
