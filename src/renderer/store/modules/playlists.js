import { DBPlaylistHandlers } from '../../../datastores/handlers/index'

function generateRandomPlaylistId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

const state = {
  playlists: [],
  defaultPlaylists: [
    {
      playlistName: 'Favorites',
      protected: true,
      removeOnWatched: false,
      description: 'Your favorite videos',
      videos: [],
      _id: 'favorites',
    },
    {
      playlistName: 'Watch Later',
      protected: true,
      removeOnWatched: true,
      description: 'Videos to watch later',
      videos: [],
      _id: 'watchLater',
    }
  ],
}

const getters = {
  getAllPlaylists: () => state.playlists,
  getFavorites: () => state.playlists.find(playlist => playlist._id === 'favorites'),
  getPlaylist: (playlistId) => state.playlists.find(playlist => playlist._id === playlistId),
  getWatchLater: () => state.playlists.find(playlist => playlist._id === 'watchLater')
}

const actions = {
  async addPlaylist({ commit }, payload) {
    // In case internal id is forgotten, generate one (instead of relying on caller and have a chance to cause data corruption)
    if (payload._id == null) {
      // {Time now in unix time}-{0-9999}
      payload._id = generateRandomPlaylistId()
    }

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
    // Caller no need to assign last updated time
    playlist.lastUpdatedAt = Date.now()

    try {
      await DBPlaylistHandlers.upsert(playlist)
      commit('upsertPlaylistToList', playlist)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async addVideo({ commit }, payload) {
    try {
      const { _id, videoData } = payload
      await DBPlaylistHandlers.upsertVideoByPlaylistId(_id, videoData)
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
      const payload = (await DBPlaylistHandlers.find()).filter((e) => e != null)
      if (payload.length === 0) {
        dispatch('addPlaylists', state.defaultPlaylists)
      } else {
        payload.forEach((playlist) => {
          let anythingUpdated = false
          // Assign generated playlist ID in case DB data corrupted
          // Especially during dev
          if (playlist._id == null) {
            // {Time now in unix time}-{0-9999}
            playlist._id = generateRandomPlaylistId()
            anythingUpdated = true
          }
          // Assign current time as last updated time in case DB data corrupted
          // Especially during dev
          if (playlist.lastUpdatedAt == null) {
            // Time now in unix time, in ms
            playlist.lastUpdatedAt = Date.now()
            anythingUpdated = true
          }
          // Save updated playlist object
          if (anythingUpdated) {
            commit('upsertPlaylistToList', playlist)
          }
        })

        const findFavorites = payload.filter((playlist) => {
          return playlist.playlistName === 'Favorites' || playlist._id === 'favorites'
        })
        const findWatchLater = payload.filter((playlist) => {
          return playlist.playlistName === 'Watch Later' || playlist._id === 'watchLater'
        })

        if (findFavorites.length === 0) {
          const favoritesPlaylist = state.defaultPlaylists.find((e) => e._id === 'favorites')
          dispatch('addPlaylist', favoritesPlaylist)
          payload.push(favoritesPlaylist)
        } else {
          const favoritesPlaylist = findFavorites[0]

          if (favoritesPlaylist._id !== 'favorites' || !favoritesPlaylist.protected) {
            const oldId = favoritesPlaylist._id
            favoritesPlaylist._id = 'favorites'
            favoritesPlaylist.protected = true
            dispatch('removePlaylist', oldId)
            dispatch('addPlaylist', favoritesPlaylist)
          }
        }

        if (findWatchLater.length === 0) {
          const watchLaterPlaylist = state.defaultPlaylists.find((e) => e._id === 'watchLater')
          dispatch('addPlaylist', watchLaterPlaylist)
          payload.push(watchLaterPlaylist)
        } else {
          const watchLaterPlaylist = findWatchLater[0]

          if (watchLaterPlaylist._id !== 'watchLater') {
            const oldId = watchLaterPlaylist._id
            watchLaterPlaylist._id = 'watchLater'
            watchLaterPlaylist.protected = true
            dispatch('removePlaylist', oldId)
            dispatch('addPlaylist', watchLaterPlaylist)
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

  async removeAllVideos({ commit }, _id) {
    try {
      await DBPlaylistHandlers.deleteAllVideosByPlaylistId(_id)
      commit('removeAllVideos', _id)
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
      const { _id, videoId } = payload
      await DBPlaylistHandlers.deleteVideoIdByPlaylistId(_id, videoId)
      commit('removeVideo', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeVideos({ commit }, payload) {
    try {
      const { _id, videoIds } = payload
      await DBPlaylistHandlers.deleteVideoIdsByPlaylistId(_id, videoIds)
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
    const playlist = state.playlists.find(playlist => playlist._id === payload._id)
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

  removeAllVideos(state, playlistId) {
    const playlist = state.playlists.find(playlist => playlist._id === playlistId)
    if (playlist) {
      playlist.videos = []
    }
  },

  removeVideo(state, payload) {
    const playlist = state.playlists.find(playlist => playlist._id === payload._id)
    if (playlist) {
      playlist.videos = playlist.videos.filter(video => video.videoId !== payload.videoId)
    }
  },

  removeVideos(state, payload) {
    const playlist = state.playlists.find(playlist => playlist._id === payload.playlistId)
    if (playlist) {
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
