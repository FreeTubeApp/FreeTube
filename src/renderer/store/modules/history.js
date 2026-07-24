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

  async unsetLastViewedPlaylistForVideos({ commit }, { videoIds, lastViewedPlaylistId }) {
    try {
      await DBHistoryHandlers.unsetLastViewedPlaylistForVideos(videoIds, lastViewedPlaylistId)
      commit('unsetRecordsLastViewedPlaylistIdInHistoryCache', { videoIds, lastViewedPlaylistId })
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async unsetLastViewedPlaylists({ commit }, lastViewedPlaylistIds) {
    try {
      await DBHistoryHandlers.unsetLastViewedPlaylists(lastViewedPlaylistIds)
      commit('unsetRecordsLastViewedPlaylistIdsInHistoryCache', lastViewedPlaylistIds)
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
    state.historyCacheById[record.videoId] = record
  },

  updateRecordWatchProgressInHistoryCache(state, { videoId, watchProgress }) {
    // historyCacheById and historyCacheSorted reference the same object instances,
    // so modifying an existing object in one of them will update both.

    const record = state.historyCacheById[videoId]

    // Don't set, if the item was removed from the watch history, as we don't have any video details
    if (record) {
      record.watchProgress = watchProgress
    }
  },

  updateRecordLastViewedPlaylistIdInHistoryCache(state, { videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId }) {
    // historyCacheById and historyCacheSorted reference the same object instances,
    // so modifying an existing object in one of them will update both.

    const record = state.historyCacheById[videoId]

    // Don't set, if the item was removed from the watch history, as we don't have any video details
    if (record) {
      record.lastViewedPlaylistId = lastViewedPlaylistId
      record.lastViewedPlaylistType = lastViewedPlaylistType
      record.lastViewedPlaylistItemId = lastViewedPlaylistItemId
    }
  },

  unsetRecordsLastViewedPlaylistIdInHistoryCache(state, { videoIds, lastViewedPlaylistId }) {
    for (const videoId of videoIds) {
      // historyCacheById and historyCacheSorted reference the same object instances,
      // so modifying an existing object in one of them will update both.

      const record = state.historyCacheById[videoId]

      // Don't unset if the item was removed from the watch history or if the last viewed playlist does not match
      if (record && record.lastViewedPlaylistId === lastViewedPlaylistId) {
        delete record.lastViewedPlaylistId
        delete record.lastViewedPlaylistType
        delete record.lastViewedPlaylistItemId
      }
    }
  },

  unsetRecordsLastViewedPlaylistIdsInHistoryCache(state, playlistIds) {
    const playlistIdSet = new Set(playlistIds)

    for (const record of state.historyCacheSorted) {
      // Don't unset if the item was removed from the watch history or if the last viewed playlist does not match
      if (record && playlistIdSet.has(record.lastViewedPlaylistId)) {
        delete record.lastViewedPlaylistId
        delete record.lastViewedPlaylistType
        delete record.lastViewedPlaylistItemId
      }
    }
  },

  removeFromHistoryCacheById(state, videoId) {
    for (let i = 0; i < state.historyCacheSorted.length; i++) {
      if (state.historyCacheSorted[i].videoId === videoId) {
        state.historyCacheSorted.splice(i, 1)
        break
      }
    }

    delete state.historyCacheById[videoId]
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
