import { set as vueSet, del as vueDel } from 'vue'
import { DBHistoryHandlers } from '../../../datastores/handlers/index'

const state = {
  historyCacheSorted: [],

  // Vuex doesn't support Maps, so we have to use an object here instead
  // TODO: switch to a Map during the Pinia migration
  historyCacheById: {}
}

const getters = {
  getHistoryCacheSorted(state) {
    return state.historyCacheSorted
  },

  getHistoryCacheById(state) {
    return state.historyCacheById
  }
}

const actions = {
  async grabHistory({ commit }) {
    try {
      const results = await DBHistoryHandlers.find()

      const resultsById = {}
      results.forEach(video => {
        resultsById[video.videoId] = video
      })

      commit('setHistoryCacheSorted', results)
      commit('setHistoryCacheById', resultsById)
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

  /**
   * @param {any} param0
   * @param {Map<string, any>} historyItems
   */
  async overwriteHistory({ commit }, historyItems) {
    try {
      const sortedRecords = Array.from(historyItems.values())

      // sort before sending saving to the database and passing to other windows
      // so that the other windows can use it as is, without having to sort the array themselves
      sortedRecords.sort((a, b) => b.timeWatched - a.timeWatched)

      await DBHistoryHandlers.overwrite(sortedRecords)

      commit('setHistoryCacheSorted', sortedRecords)
      commit('setHistoryCacheById', Object.fromEntries(historyItems))
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
      commit('setHistoryCacheSorted', [])
      commit('setHistoryCacheById', {})
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

  async updateLastViewedPlaylist({ commit }, { videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId }) {
    try {
      await DBHistoryHandlers.updateLastViewedPlaylist(videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId)
      commit('updateRecordLastViewedPlaylistIdInHistoryCache', { videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId })
    } catch (errMessage) {
      console.error(errMessage)
    }
  },
}

const mutations = {
  setHistoryCacheSorted(state, historyCacheSorted) {
    state.historyCacheSorted = historyCacheSorted
  },

  setHistoryCacheById(state, historyCacheById) {
    state.historyCacheById = historyCacheById
  },

  upsertToHistoryCache(state, record) {
    const i = state.historyCacheSorted.findIndex((currentRecord) => {
      return record.videoId === currentRecord.videoId
    })

    if (i !== -1) {
      // Already in cache
      // Must be hoisted to top, remove it and then unshift it
      state.historyCacheSorted.splice(i, 1)
    }

    state.historyCacheSorted.unshift(record)
    vueSet(state.historyCacheById, record.videoId, record)
  },

  updateRecordWatchProgressInHistoryCache(state, { videoId, watchProgress }) {
    // historyCacheById and historyCacheSorted reference the same object instances,
    // so modifying an existing object in one of them will update both.

    const record = state.historyCacheById[videoId]

    // Don't set, if the item was removed from the watch history, as we don't have any video details
    if (record) {
      vueSet(record, 'watchProgress', watchProgress)
    }
  },

  updateRecordLastViewedPlaylistIdInHistoryCache(state, { videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId }) {
    // historyCacheById and historyCacheSorted reference the same object instances,
    // so modifying an existing object in one of them will update both.

    const record = state.historyCacheById[videoId]

    // Don't set, if the item was removed from the watch history, as we don't have any video details
    if (record) {
      vueSet(record, 'lastViewedPlaylistId', lastViewedPlaylistId)
      vueSet(record, 'lastViewedPlaylistType', lastViewedPlaylistType)
      vueSet(record, 'lastViewedPlaylistItemId', lastViewedPlaylistItemId)
    }
  },

  removeFromHistoryCacheById(state, videoId) {
    for (let i = 0; i < state.historyCacheSorted.length; i++) {
      if (state.historyCacheSorted[i].videoId === videoId) {
        state.historyCacheSorted.splice(i, 1)
        break
      }
    }

    vueDel(state.historyCacheById, videoId)
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
