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

  updateHistory({ commit }, record) {
    historyDb.update(
      { videoId: record.videoId },
      record,
      { upsert: true }
    ).catch(console.error)

    commit('upsertToHistoryCache', record)
  },

  removeFromHistory({ commit }, videoId) {
    historyDb.remove({ videoId: videoId }).catch(console.error)
    commit('removeFromHistoryCacheById', videoId)
  },

  removeAllHistory({ commit }) {
    historyDb.remove({}, { multi: true }).catch(console.error)
    commit('setHistoryCache', [])
  },

  updateWatchProgress({ commit }, { videoId, watchProgress }) {
    historyDb.update({ videoId }, { $set: { watchProgress } }, { upsert: true }).catch(console.error)
    commit('updateRecordWatchProgressInHistoryCache', { videoId, watchProgress })
  },

  compactHistory(_) {
    historyDb.persistence.compactDatafile()
  }
}

const mutations = {
  setHistoryCache(state, historyCache) {
    state.historyCache = historyCache
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
