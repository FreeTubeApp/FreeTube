import { DBPlaylistHandlers } from '../../../datastores/handlers/index'

const state = {
  playlists: [
    {
      playlistName: 'Favorites',
      protected: true,
      videos: []
    },
    {
      playlistName: 'WatchLater',
      protected: true,
      removeOnWatched: true,
      videos: []
    }
  ],
  searchPlaylistCache: {
    videos: []
  }
}

const getters = {
  getAllPlaylists: () => state.playlists,
  getFavorites: () => state.playlists[0],
  getPlaylist: (playlistId) => state.playlists.find(playlist => playlist._id === playlistId),
  getWatchLater: () => state.playlists[1],
  getSearchPlaylistCache: () => {
    return state.searchPlaylistCache
  }
}

const actions = {
  async addPlaylist({ commit }, payload) {
    try {
      await DBPlaylistHandlers.create(payload)
      commit('addPlaylist', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async addPlaylists({ commit }, payload) {
    try {
      await DBPlaylistHandlers.create(payload)
      commit('addPlaylists', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async addVideo({ commit }, payload) {
    try {
      const { playlistName, videoData } = payload
      await DBPlaylistHandlers.upsertVideoByPlaylistName(playlistName, videoData)
      commit('addVideo', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async addVideos({ commit }, payload) {
    try {
      const { playlistId, videoIds } = payload
      await DBPlaylistHandlers.upsertVideoIdsByPlaylistId(playlistId, videoIds)
      commit('addVideos', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async grabAllPlaylists({ commit, dispatch, state }) {
    try {
      const payload = await DBPlaylistHandlers.find()
      if (payload.length === 0) {
        commit('setAllPlaylists', state.playlists)
        dispatch('addPlaylists', payload)
      } else {
        commit('setAllPlaylists', payload)
      }
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeAllPlaylists({ commit }) {
    try {
      await DBPlaylistHandlers.deleteAll()
      commit('removeAllPlaylists')
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeAllVideos({ commit }, playlistName) {
    try {
      await DBPlaylistHandlers.deleteAllVideosByPlaylistName(playlistName)
      commit('removeAllVideos', playlistName)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removePlaylist({ commit }, playlistId) {
    try {
      await DBPlaylistHandlers.delete(playlistId)
      commit('removePlaylist', playlistId)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removePlaylists({ commit }, playlistIds) {
    try {
      await DBPlaylistHandlers.deleteMultiple(playlistIds)
      commit('removePlaylists', playlistIds)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeVideo({ commit }, payload) {
    try {
      const { playlistName, videoId } = payload
      await DBPlaylistHandlers.deleteVideoIdByPlaylistName(playlistName, videoId)
      commit('removeVideo', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeVideos({ commit }, payload) {
    try {
      const { playlistName, videoIds } = payload
      await DBPlaylistHandlers.deleteVideoIdsByPlaylistName(playlistName, videoIds)
      commit('removeVideos', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },
  async searchFavoritePlaylist({ commit }, query) {
    const re = new RegExp(query, 'i')
    // filtering in the frontend because the documents are the playlists and not the videos
    const results = state.playlists[0].videos.slice()
      .filter((video) => {
        return video.author.match(re) ||
      video.title.match(re)
      })
    commit('setPlaylistCache', results)
  }
}

const mutations = {
  setPlaylistCache(state, result) {
    state.searchPlaylistCache = {
      videos: result
    }
  },
  addPlaylist(state, payload) {
    state.playlists.push(payload)
  },

  addPlaylists(state, payload) {
    state.playlists = state.playlists.concat(payload)
  },

  addVideo(state, payload) {
    const playlist = state.playlists.find(playlist => playlist.playlistName === payload.playlistName)
    if (playlist) {
      playlist.videos.push(payload.videoData)
    }
  },

  addVideos(state, payload) {
    const playlist = state.playlists.find(playlist => playlist._id === payload.playlistId)
    if (playlist) {
      playlist.videos = playlist.videos.concat(payload.playlistIds)
    }
  },

  removeAllPlaylists(state) {
    state.playlists = state.playlists.filter(playlist => playlist.protected !== true)
  },

  removeAllVideos(state, playlistName) {
    const playlist = state.playlists.find(playlist => playlist.playlistName === playlistName)
    if (playlist) {
      playlist.videos = []
    }
  },

  removeVideo(state, payload) {
    const playlist = state.playlists.findIndex(playlist => playlist.playlistName === payload.playlistName)
    if (playlist !== -1) {
      state.playlists[playlist].videos = state.playlists[playlist].videos.filter(video => video.videoId !== payload.videoId)
    }
  },

  removeVideos(state, payload) {
    const playlist = state.playlists.findIndex(playlist => playlist._id === payload.playlistId)
    if (playlist !== -1) {
      playlist.videos = playlist.videos.filter(video => payload.videoId.indexOf(video) === -1)
    }
  },

  removePlaylist(state, playlistId) {
    state.playlists = state.playlists.filter(playlist => playlist._id !== playlistId || playlist.protected)
  },

  setAllPlaylists(state, payload) {
    state.playlists = payload
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
