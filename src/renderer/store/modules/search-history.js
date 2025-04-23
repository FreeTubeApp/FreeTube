import { MIXED_SEARCH_HISTORY_ENTRIES_DISPLAY_LIMIT, SEARCH_RESULTS_DISPLAY_LIMIT } from '../../../constants'
import { DBSearchHistoryHandlers } from '../../../datastores/handlers/index'

const state = {
  searchHistoryEntries: []
}

const getters = {
  getSearchHistoryEntries: (state) => {
    return state.searchHistoryEntries
  },

  getLatestSearchHistoryNames: (state) => {
    return state.searchHistoryEntries.slice(0, SEARCH_RESULTS_DISPLAY_LIMIT).map((entry) => entry._id)
  },

  getLatestMatchingSearchHistoryNames: (state) => (id) => {
    const matches = []
    let counter = 0

    for (const entry of state.searchHistoryEntries) {
      if (entry._id.startsWith(id)) {
        matches.push(entry._id)

        counter++

        if (counter === MIXED_SEARCH_HISTORY_ENTRIES_DISPLAY_LIMIT) {
          break
        }
      }
    }

    // prioritize more concise matches
    return matches.sort((a, b) => a.length - b.length)
  },

  getSearchHistoryEntryWithId: (state) => (id) => {
    return state.searchHistoryEntries.find(p => p._id === id)
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
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
