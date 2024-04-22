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
  },

  getPageBookmarksWithRouteSubstring: (state) => (routeSubstring, routeToExclude) => {
    if (routeSubstring === '') {
      return []
    }
    const routeSubstringToLower = routeSubstring.toLowerCase()
    const pageBookmarks = state.pageBookmarks.filter((pageBookmark) =>
      pageBookmark && pageBookmark.route.toLowerCase().includes(routeSubstringToLower) && pageBookmark.route !== routeToExclude
    )
    return pageBookmarks
  }
}
const actions = {
  async grabPageBookmarks({ commit }) {
    try {
      const results = await DBSearchHistoryHandlers.find()
      commit('setPageBookmarks', results)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async createPageBookmark({ commit }, pageBookmark) {
    try {
      const newPageBookmark = await DBSearchHistoryHandlers.create(pageBookmark)
      commit('addPageBookmarkToList', newPageBookmark)
    } catch (errMessage) {
      console.error(errMessage)
    }
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
  addPageBookmarkToList(state, pageBookmark) {
    state.pageBookmarks.push(pageBookmark)
  },

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

  removePageBookmarkFromList(state, route) {
    const i = state.pageBookmarks.findIndex((pageBookmark) => {
      return pageBookmark.route === route
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
