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

  async updateHistory({ commit, dispatch, state }, entry) {
    await historyDb.update(
      { videoId: entry.videoId },
      entry,
      { upsert: true }
    )

    const entryIndex = state.historyCache.findIndex((currentEntry) => {
      return entry.videoId === currentEntry.videoId
    })

    entryIndex === -1
      ? commit('insertNewEntryToHistoryCache', entry)
      : commit('hoistEntryToTopOfHistoryCache', {
        currentIndex: entryIndex,
        updatedEntry: entry
      })

    dispatch('propagateHistory')
  },
  async searchHistory({ commit }, query) {
    const re = new RegExp(query, 'i')
    const results = await historyDb.find({ $or: [{ author: { $regex: re } }, { title: { $regex: re } }, { videoId: { $regex: re } }] }).sort({ timeWatched: -1 })
    commit('setHistoryCache', results)
  },
  async removeFromHistory({ commit, dispatch }, videoId) {
    await historyDb.remove({ videoId: videoId })

    const updatedCache = state.historyCache.filter((entry) => {
      return entry.videoId !== videoId
    })

    commit('setHistoryCache', updatedCache)

    dispatch('propagateHistory')
  },

  async removeAllHistory({ commit, dispatch }) {
    await historyDb.remove({}, { multi: true })
    commit('setHistoryCache', [])
    dispatch('propagateHistory')
  },

  async updateWatchProgress({ commit, dispatch }, entry) {
    await historyDb.update(
      { videoId: entry.videoId },
      { $set: { watchProgress: entry.watchProgress } },
      { upsert: true }
    )

    const entryIndex = state.historyCache.findIndex((currentEntry) => {
      return entry.videoId === currentEntry.videoId
    })

    commit('updateEntryWatchProgressInHistoryCache', {
      index: entryIndex,
      value: entry.watchProgress
    })

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

  updateEntryWatchProgressInHistoryCache(state, { index, value }) {
    state.historyCache[index].watchProgress = value
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
