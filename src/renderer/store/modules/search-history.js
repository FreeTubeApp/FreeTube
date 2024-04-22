import { DBSearchHistoryHandlers } from '../../../datastores/handlers/index'

const state = {
  pageBookmarks: []
}

const getters = {
  getPageBookmarks: () => {
    return state.pageBookmarks
  },

  getPageBookmarkWithRoute: (state) => (route) => {
    const pageBookmark = state.pageBookmarks.find(p => p.route === route)
    return pageBookmark
  }
}

const actions = {
  async createPageBookmark({ commit }, pageBookmark) {
    state.pageBookmarks.push(pageBookmark)
  },

  async updatePageBookmark({ commit }, pageBookmark) {
    try {
      await DBSearchHistoryHandlers.upsert(pageBookmark)
      commit('upsertPageBookmarkToList', pageBookmark)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removePageBookmark({ commit }, route) {
    try {
      await DBSearchHistoryHandlers.delete(route)
      commit('removePageBookmarkFromList', route)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeAllPageBookmarks({ commit }) {
    try {
      await DBSearchHistoryHandlers.deleteAll()
      commit('setPageBookmarks', [])
    } catch (errMessage) {
      console.error(errMessage)
    }
  },
}

const mutations = {
  setPageBookmarks(state, pageBookmarks) {
    state.pageBookmarks = pageBookmarks
  },

  upsertPageBookmarkToList(state, updatedPageBookmark) {
    const i = state.pageBookmarks.findIndex((p) => {
      return p.route === updatedPageBookmark.route
    })

    if (i === -1) {
      state.pageBookmarks.push(updatedPageBookmark)
    } else {
      state.pageBookmarks.splice(i, 1, updatedPageBookmark)
    }
  },

  removePageBookmarkFromList(state, pageBookmarkId) {
    const i = state.pageBookmarks.findIndex((pageBookmark) => {
      return pageBookmark.route === pageBookmarkId
    })

    state.pageBookmarks.splice(i, 1)
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
