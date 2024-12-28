import { SEARCH_RESULTS_DISPLAY_LIMIT } from '../../../constants'
import { DBSearchHistoryHandlers } from '../../../datastores/handlers/index'

const state = {
  searchHistoryEntries: []
}

const getters = {
  getSearchHistoryEntries: (state) => {
    return state.searchHistoryEntries
  },

  getLatestSearchHistoryNames: (state) => {
    return state.searchHistoryEntries.slice(0, SEARCH_RESULTS_DISPLAY_LIMIT).map((entry) => entry.name)
  },

  getLatestMatchingSearchHistoryNames: (state) => (name) => {
    const matches = state.searchHistoryEntries.filter((entry) => entry.name.startsWith(name))

    // prioritize more concise matches
    return matches.map((entry) => entry.name)
      .toSorted((a, b) => a.length - b.length)
  },

  getSearchHistoryEntryWithId: (state) => (id) => {
    const searchHistoryEntry = state.searchHistoryEntries.find(p => p._id === id)
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
      return p._id !== updatedSearchHistoryEntry._id
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
