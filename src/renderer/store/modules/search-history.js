import { DBSearchHistoryHandlers } from '../../../datastores/handlers/index'

const state = {
  searchHistoryEntries: []
}

const getters = {
  getSearchHistoryEntries: (state) => {
    return state.searchHistoryEntries
  },

  getSearchHistoryEntryWithRoute: (state) => (route) => {
    const searchHistoryEntry = state.searchHistoryEntries.find(p => p.route === route)
    return searchHistoryEntry
  },

  getSearchHistoryEntriesMatchingQuery: (state) => (query, routeToExclude) => {
    if (query === '') {
      return []
    }
    const queryToLower = query.toLowerCase()
    return state.searchHistoryEntries.filter((searchHistoryEntry) =>
      searchHistoryEntry.name.toLowerCase().includes(queryToLower) && searchHistoryEntry.route !== routeToExclude
    )
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
    state.searchHistoryEntries.push(searchHistoryEntry)
  },

  setSearchHistoryEntries(state, searchHistoryEntries) {
    state.searchHistoryEntries = searchHistoryEntries
  },

  upsertSearchHistoryEntryToList(state, updatedSearchHistoryEntry) {
    const i = state.searchHistoryEntries.findIndex((p) => {
      return p.route === updatedSearchHistoryEntry.route
    })

    if (i === -1) {
      state.searchHistoryEntries.push(updatedSearchHistoryEntry)
    } else {
      state.searchHistoryEntries.splice(i, 1, updatedSearchHistoryEntry)
    }
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
