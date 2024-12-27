import { DBSearchHistoryHandlers } from '../../../datastores/handlers/index'

// matches # of results we show for search suggestions
const SEARCH_HISTORY_ENTRIES_DISPLAY_LIMIT = 14

const state = {
  searchHistoryEntries: []
}

const getters = {
  getSearchHistoryEntries: (state) => {
    return state.searchHistoryEntries
  },

  getLatestUniqueSearchHistoryNames: (state) => {
    return state.searchHistoryEntries.slice(0, SEARCH_HISTORY_ENTRIES_DISPLAY_LIMIT).map((entry) => entry.name)
  },

  getSearchHistoryEntryWithId: (state) => (id) => {
    const searchHistoryEntry = state.searchHistoryEntries.find(p => p._id === id)
    return searchHistoryEntry
  },

  getSearchHistoryIdsForMatchingUserPlaylistIds: (state) => (playlistIds) => {
    const searchHistoryIds = []
    const allSearchHistoryEntries = state.searchHistoryEntries
    const searchHistoryEntryLimitedIdsMap = new Map()
    allSearchHistoryEntries.forEach((searchHistoryEntry) => {
      searchHistoryEntryLimitedIdsMap.set(searchHistoryEntry._id, searchHistoryEntry._id)
    })

    playlistIds.forEach((playlistId) => {
      const id = `/playlist/${playlistId}?playlistType=user&searchQueryText=`
      if (!searchHistoryEntryLimitedIdsMap.has(id)) {
        return
      }

      searchHistoryIds.push(searchHistoryEntryLimitedIdsMap.get(id))
    })

    return searchHistoryIds
  }
}
const actions = {
  async grabSearchHistoryEntries({ commit }) {
    try {
      const results = await DBSearchHistoryHandlers.find()
      commit('setSearchHistoryEntries', results)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async createSearchHistoryEntry({ commit }, searchHistoryEntry) {
    try {
      const newSearchHistoryEntry = await DBSearchHistoryHandlers.create(searchHistoryEntry)
      commit('addSearchHistoryEntryToList', newSearchHistoryEntry)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async updateSearchHistoryEntry({ commit }, searchHistoryEntry) {
    try {
      await DBSearchHistoryHandlers.upsert(searchHistoryEntry)
      commit('upsertSearchHistoryEntryToList', searchHistoryEntry)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeSearchHistoryEntry({ commit }, _id) {
    try {
      await DBSearchHistoryHandlers.delete(_id)
      commit('removeSearchHistoryEntryFromList', _id)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeSearchHistoryEntries({ commit }, ids) {
    try {
      await DBSearchHistoryHandlers.deleteMultiple(ids)
      commit('removeSearchHistoryEntriesFromList', ids)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeUserPlaylistSearchHistoryEntries({ dispatch, getters }, userPlaylistIds) {
    const searchHistoryIds = getters.getSearchHistoryIdsForMatchingUserPlaylistIds(userPlaylistIds)
    if (searchHistoryIds.length === 0) {
      return
    }

    dispatch('removeSearchHistoryEntries', searchHistoryIds)
  },

  async removeAllSearchHistoryEntries({ commit }) {
    try {
      await DBSearchHistoryHandlers.deleteAll()
      commit('setSearchHistoryEntries', [])
    } catch (errMessage) {
      console.error(errMessage)
    }
  },
}

const mutations = {
  addSearchHistoryEntryToList(state, searchHistoryEntry) {
    state.searchHistoryEntries.unshift(searchHistoryEntry)
  },

  setSearchHistoryEntries(state, searchHistoryEntries) {
    state.searchHistoryEntries = searchHistoryEntries
  },

  upsertSearchHistoryEntryToList(state, updatedSearchHistoryEntry) {
    state.searchHistoryEntries = state.searchHistoryEntries.filter((p) => {
      return p.name !== updatedSearchHistoryEntry._id
    })

    state.searchHistoryEntries.unshift(updatedSearchHistoryEntry)
  },

  removeSearchHistoryEntryFromList(state, _id) {
    state.searchHistoryEntries = state.searchHistoryEntries.filter((searchHistoryEntry) => searchHistoryEntry._id !== _id)
  },

  removeSearchHistoryEntriesFromList(state, ids) {
    state.searchHistoryEntries = state.searchHistoryEntries.filter((searchHistoryEntry) => !ids.includes(searchHistoryEntry._id))
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
