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

  updateHistory({ commit, dispatch }, record) {
    historyDb.update(
      { videoId: record.videoId },
      record,
      { upsert: true }
    ).catch(console.error)

    commit('upsertToHistoryCache', record)
    dispatch('propagateHistory')
  },

  removeFromHistory({ commit, dispatch }, videoId) {
    historyDb.remove({ videoId: videoId }).catch(console.error)
    commit('removeFromHistoryCacheById', videoId)
    dispatch('propagateHistory')
  },

  removeAllHistory({ commit, dispatch }) {
    historyDb.remove({}, { multi: true }).catch(console.error)
    commit('setHistoryCache', [])
    dispatch('propagateHistory')
  },

  updateWatchProgress({ commit, dispatch }, { videoId, watchProgress }) {
    historyDb.update({ videoId }, { $set: { watchProgress } }, { upsert: true }).catch(console.error)
    commit('updateRecordWatchProgressInHistoryCache', { videoId, watchProgress })
    dispatch('propagateHistory')
  },

  propagateHistory({ getters: { getUsingElectron: usingElectron } }) {
    if (usingElectron) {
      const { ipcRenderer } = require('electron')
      ipcRenderer.send('syncWindows', {
        type: 'history',
        data: state.historyCache
      })
    }
  },

  compactHistory(_) {
    historyDb.persistence.compactDatafile()
  }
}

const mutations = {
  setHistoryCache(state, historyCache) {
    state.historyCache = historyCache
  },

  insertNewEntryToHistoryCache(state, entry) {
    state.historyCache.unshift(entry)
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
