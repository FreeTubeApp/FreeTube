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

  async updateHistory({ commit, state }, entry) {
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
  },

  async removeFromHistory({ commit }, videoId) {
    await historyDb.remove({ videoId: videoId })

    const updatedCache = state.historyCache.filter((entry) => {
      return entry.videoId !== videoId
    })

    commit('setHistoryCache', updatedCache)
  },

  async removeAllHistory({ commit }) {
    await historyDb.remove({}, { multi: true })
    commit('setHistoryCache', [])
  },

  async updateWatchProgress({ commit }, entry) {
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
