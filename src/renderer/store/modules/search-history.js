import { DBSearchHistoryHandlers } from '../../../datastores/handlers/index'

const state = {
  pageBookmarks: []
}

const getters = {
  getPageBookmarks: (state) => {
    return state.pageBookmarks
  },

  getPageBookmarkWithRoute: (state) => (route) => {
    const pageBookmark = state.pageBookmarks.find(p => p.route === route)
    return pageBookmark
  },

  getPageBookmarksMatchingQuery: (state) => (query, routeToExclude) => {
    if (query === '') {
      return []
    }
    const queryToLower = query.toLowerCase()
    return state.pageBookmarks.filter((pageBookmark) =>
      pageBookmark.name.toLowerCase().includes(queryToLower) && pageBookmark.route !== routeToExclude
    )
  },

  getPageBookmarkIdsForMatchingUserPlaylistIds: (state) => (playlistIds) => {
    const pageBookmarkIds = []
    const allPageBookmarks = state.pageBookmarks
    const pageBookmarkLimitedRoutesMap = new Map()
    allPageBookmarks.forEach((pageBookmark) => {
      pageBookmarkLimitedRoutesMap.set(pageBookmark.route, pageBookmark._id)
    })

    playlistIds.forEach((playlistId) => {
      const route = `/playlist/${playlistId}?playlistType=user&searchQueryText=`
      if (!pageBookmarkLimitedRoutesMap.has(route)) {
        return
      }

      pageBookmarkIds.push(pageBookmarkLimitedRoutesMap.get(route))
    })

    return pageBookmarkIds
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

  async removePageBookmark({ commit }, _id) {
    try {
      await DBSearchHistoryHandlers.delete(_id)
      commit('removePageBookmarkFromList', _id)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removePageBookmarks({ commit }, ids) {
    try {
      await DBSearchHistoryHandlers.deleteMultiple(ids)
      commit('removePageBookmarksFromList', ids)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeUserPlaylistPageBookmarks({ dispatch, getters }, userPlaylistIds) {
    const pageBookmarkIds = getters.getPageBookmarkIdsForMatchingUserPlaylistIds(userPlaylistIds)
    if (pageBookmarkIds.length === 0) {
      return
    }

    dispatch('removePageBookmarks', pageBookmarkIds)
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

  removePageBookmarkFromList(state, _id) {
    const i = state.pageBookmarks.findIndex((pageBookmark) => {
      return pageBookmark._id === _id
    })

    state.pageBookmarks.splice(i, 1)
  },

  removePageBookmarksFromList(state, ids) {
    state.pageBookmarks = state.pageBookmarks.filter((pageBookmark) => !ids.includes(pageBookmark._id))
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
