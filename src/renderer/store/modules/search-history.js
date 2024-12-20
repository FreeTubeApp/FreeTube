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

  getLatestUniqueSearchHistoryEntries: (state) => (routeToExclude) => {
    const nameSet = new Set()
    return state.searchHistoryEntries.filter((entry) => {
      if (nameSet.has(entry.name) || routeToExclude === entry.route) {
        return false
      }

      nameSet.add(entry.name)
      return true
    }).slice(0, SEARCH_HISTORY_ENTRIES_DISPLAY_LIMIT)
  },

  getSearchHistoryEntryWithRoute: (state) => (route) => {
    const searchHistoryEntry = state.searchHistoryEntries.find(p => p.route === route)
    return searchHistoryEntry
  },

  getSearchHistoryIdsForMatchingUserPlaylistIds: (state) => (playlistIds) => {
    const searchHistoryIds = []
    const allSearchHistoryEntries = state.searchHistoryEntries
    const searchHistoryEntryLimitedRoutesMap = new Map()
    allSearchHistoryEntries.forEach((searchHistoryEntry) => {
      searchHistoryEntryLimitedRoutesMap.set(searchHistoryEntry.route, searchHistoryEntry._id)
    })

    playlistIds.forEach((playlistId) => {
      const route = `/playlist/${playlistId}?playlistType=user&searchQueryText=`
      if (!searchHistoryEntryLimitedRoutesMap.has(route)) {
        return
      }

      searchHistoryIds.push(searchHistoryEntryLimitedRoutesMap.get(route))
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
      return p.route !== updatedSearchHistoryEntry.route
    })

    state.searchHistoryEntries.unshift(updatedSearchHistoryEntry)
  },

  removeSearchHistoryEntryFromList(state, _id) {
    const i = state.searchHistoryEntries.findIndex((searchHistoryEntry) => {
      return searchHistoryEntry._id === _id
    })

    state.searchHistoryEntries.splice(i, 1)
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
