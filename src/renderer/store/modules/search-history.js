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

  getLatestUniqueSearchHistoryEntries: (state) => {
    const nameSet = new Set()
    return state.searchHistoryEntries.filter((entry) => {
      if (nameSet.has(entry.name)) {
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
