import { DBHistoryHandlers } from '../../../datastores/handlers/index'

const state = {
  historyCache: [],
  searchHistoryCache: []
}

const getters = {
  getHistoryCache: () => {
    return state.historyCache
  },
  getSearchHistoryCache: () => {
    return state.searchHistoryCache
  }
}

const actions = {
  async grabHistory({ commit }) {
    try {
      const results = await DBHistoryHandlers.find()
      commit('setHistoryCache', results)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async updateHistory({ commit }, record) {
    try {
      await DBHistoryHandlers.upsert(record)
      commit('upsertToHistoryCache', record)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeFromHistory({ commit }, videoId) {
    try {
      await DBHistoryHandlers.delete(videoId)
      commit('removeFromHistoryCacheById', videoId)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeAllHistory({ commit }) {
    try {
      await DBHistoryHandlers.deleteAll()
      commit('setHistoryCache', [])
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async searchHistory({ commit }, query) {
    try {
      const results = await DBHistoryHandlers.search(query)
      commit('setSearchHistoryCache', results)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async updateWatchProgress({ commit }, { videoId, watchProgress }) {
    try {
      await DBHistoryHandlers.updateWatchProgress(videoId, watchProgress)
      commit('updateRecordWatchProgressInHistoryCache', { videoId, watchProgress })
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  compactHistory(_) {
    DBHistoryHandlers.persist()
  }
}

const mutations = {
  setHistoryCache(state, historyCache) {
    state.historyCache = historyCache
  },

  setSearchHistoryCache(state, result) {
    state.searchHistoryCache = result
  },

  hoistEntryToTopOfHistoryCache(state, { currentIndex, updatedEntry }) {
    state.historyCache.splice(currentIndex, 1)
    state.historyCache.unshift(updatedEntry)
  },

  upsertToHistoryCache(state, record) {
    const i = state.historyCache.findIndex((currentRecord) => {
      return record.videoId === currentRecord.videoId
    })

    if (i !== -1) {
      // Already in cache
      // Must be hoisted to top, remove it and then unshift it
      state.historyCache.splice(i, 1)
    }

    state.historyCache.unshift(record)
  },

  updateRecordWatchProgressInHistoryCache(state, { videoId, watchProgress }) {
    const i = state.historyCache.findIndex((currentRecord) => {
      return currentRecord.videoId === videoId
    })

    const targetRecord = Object.assign({}, state.historyCache[i])
    targetRecord.watchProgress = watchProgress
    state.historyCache.splice(i, 1, targetRecord)
  },

  removeFromHistoryCacheById(state, videoId) {
    for (let i = 0; i < state.historyCache.length; i++) {
      if (state.historyCache[i].videoId === videoId) {
        state.historyCache.splice(i, 1)
        break
      }
    }
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
