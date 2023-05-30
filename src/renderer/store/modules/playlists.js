import { DBPlaylistHandlers } from '../../../datastores/handlers/index'

const state = {
  playlists: [
    {
      playlistName: 'Favorites',
      protected: true,
      removeOnWatched: false,
      description: 'Your favorites',
      videos: [],
      _id: 'favorites',
    },
    {
      playlistName: 'Watch Later',
      protected: true,
      removeOnWatched: true,
      description: 'videos to watch later',
      videos: [],
      _id: 'watchLater',
    }
  ]
}

const getters = {
  getAllPlaylists: () => state.playlists,
  getFavorites: () => state.playlists[0],
  getPlaylist: (playlistId) => state.playlists.find(playlist => playlist._id === playlistId),
  getWatchLater: () => state.playlists[1]
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

  async updatePlaylist({ commit }, playlist) {
    try {
      await DBPlaylistHandlers.upsert(playlist)
      commit('upsertProfileToList', playlist)
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
      console.log('grabAllPlaylists >>')
      console.log({ payload })
      if (payload.length === 0) {
        commit('setAllPlaylists', state.playlists)
        dispatch('addPlaylists', payload)
        dispatch('addPlaylists', state.playlists)
      } else {
        const findFavorites = payload.filter((playlist) => {
          return playlist.playlistName === 'Favorites' || playlist._id === 'favorites'
        })
        const findWatchLater = payload.filter((playlist) => {
          return playlist.playlistName === 'Watch Later' || playlist._id === 'watchLater'
        })

        if (findFavorites.length === 0) {
          dispatch('addPlaylist', state.playlists[0])
          payload.push(state.playlists[0])
        } else {
          const favoritesPlaylist = findFavorites[0]

          if (favoritesPlaylist._id !== 'favorites') {
            const oldId = favoritesPlaylist._id
            favoritesPlaylist._id = 'favorites'
            dispatch('addPlaylist', favoritesPlaylist)
            dispatch('removePlaylist', oldId)
          }
        }

        if (findWatchLater.length === 0) {
          dispatch('addPlaylist', state.playlists[1])
          payload.push(state.playlists[1])
        } else {
          const watchLaterPlaylist = findFavorites[0]

          if (watchLaterPlaylist._id !== 'favorites') {
            const oldId = watchLaterPlaylist._id
            watchLaterPlaylist._id = 'favorites'
            dispatch('addPlaylist', watchLaterPlaylist)
            dispatch('removePlaylist', oldId)
          }
        }

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
  }
}

const mutations = {
  addPlaylist(state, payload) {
    state.playlists.push(payload)
  },

  addPlaylists(state, payload) {
    state.playlists = state.playlists.concat(payload)
  },

  upsertPlaylistToList(state, updatedPlaylist) {
    const i = state.playlists.findIndex((p) => {
      return p._id === updatedPlaylist._id
    })

    if (i === -1) {
      state.playlists.push(updatedPlaylist)
    } else {
      state.playlists.splice(i, 1, updatedPlaylist)
    }
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
