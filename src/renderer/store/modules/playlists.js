import { DBPlaylistHandlers } from '../../../datastores/handlers/index'

function generateRandomPlaylistId() {
  return `ft-playlist--${generateRandomUniqueId()}`
}

function generateRandomPlaylistName() {
  return `Playlist ${new Date().toISOString()}-${Math.floor(Math.random() * 10000)}`
}

function generateRandomUniqueId() {
  // To avoid importing `crypto` from NodeJS
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

const state = {
  // Playlist loading takes time on app load (new windows)
  // This is necessary to let components to know when to start data loading
  // which depends on playlist data being ready
  playlistsReady: false,
  playlists: [],
  defaultPlaylists: [
    {
      playlistName: 'Favorites',
      protected: true,
      description: 'Your favorite videos',
      videos: [],
      _id: 'favorites',
    }
  ],
}

const getters = {
  getPlaylistsReady: () => state.playlistsReady,
  getAllPlaylists: () => state.playlists,
  getFavorites: () => state.playlists.find(playlist => playlist._id === 'favorites'),
  getPlaylist: (state) => (playlistId) => {
    return state.playlists.find(playlist => playlist._id === playlistId)
  },
}

const actions = {
  async addPlaylist({ commit }, payload) {
    // In case internal id is forgotten, generate one (instead of relying on caller and have a chance to cause data corruption)
    if (payload._id == null) {
      // {Time now in unix time}-{0-9999}
      payload._id = generateRandomPlaylistId()
    }
    // Ensure playlist name trimmed
    if (typeof payload.playlistName === 'string') {
      payload.playlistName = payload.playlistName.trim()
    }
    // Ensure playlist description trimmed
    if (typeof payload.description === 'string') {
      payload.description = payload.description.trim()
    }
    payload.createdAt = Date.now()
    payload.lastUpdatedAt = Date.now()
    // Ensure all videos has required attributes
    if (Array.isArray(payload.videos)) {
      payload.videos.forEach(videoData => {
        if (videoData.timeAdded == null) {
          videoData.timeAdded = new Date().getTime()
        }
        if (videoData.playlistItemId == null) {
          videoData.playlistItemId = generateRandomUniqueId()
        }
      })
    }

    try {
      await DBPlaylistHandlers.create([payload])
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
    // Ensure playlist name trimmed
    if (typeof playlist.playlistName === 'string') {
      playlist.playlistName = playlist.playlistName.trim()
    }
    // Ensure playlist description trimmed
    if (typeof playlist.description === 'string') {
      playlist.description = playlist.description.trim()
    }
    // Caller no need to assign last updated time
    playlist.lastUpdatedAt = Date.now()

    try {
      await DBPlaylistHandlers.upsert(playlist)
      commit('upsertPlaylistToList', playlist)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async updatePlaylistLastPlayedAt({ commit }, playlist) {
    // This action does NOT update `lastUpdatedAt` on purpose
    // Only `lastPlayedAt` should be updated
    playlist.lastPlayedAt = Date.now()

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
      if (videoData.timeAdded == null) {
        videoData.timeAdded = new Date().getTime()
      }
      if (videoData.playlistItemId == null) {
        videoData.playlistItemId = generateRandomUniqueId()
      }
      // For backward compatibility
      if (videoData.type == null) {
        videoData.type = 'video'
      }
      await DBPlaylistHandlers.upsertVideoByPlaylistId(_id, videoData)
      commit('addVideo', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async addVideos({ commit }, payload) {
    // Assumes videos are added NOT from export
    // Since this action will ensure uniqueness of `playlistItemId` of added video entries
    try {
      const { _id, videos } = payload
      const newVideoObjects = videos.map((video) => {
        // Create a new object to prevent changing existing values outside
        const videoData = Object.assign({}, video)
        if (videoData.timeAdded == null) {
          videoData.timeAdded = new Date().getTime()
        }
        videoData.playlistItemId = generateRandomUniqueId()
        // For backward compatibility
        if (videoData.type == null) {
          videoData.type = 'video'
        }
        // Undesired attributes, even with `null` values
        [
          'description',
          'viewCount',
        ].forEach(attrName => {
          if (typeof videoData[attrName] !== 'undefined') {
            delete videoData[attrName]
          }
        })

        return videoData
      })
      await DBPlaylistHandlers.upsertVideosByPlaylistId(_id, newVideoObjects)
      commit('addVideos', { _id, videos: newVideoObjects })
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async grabAllPlaylists({ commit, dispatch, state }) {
    try {
      const payload = (await DBPlaylistHandlers.find()).filter((e) => e != null)
      if (payload.length === 0) {
        // Not using `addPlaylists` to ensure required attributes with dynamic values added
        state.defaultPlaylists.forEach(playlist => {
          dispatch('addPlaylist', playlist)
        })
      } else {
        payload.forEach((playlist) => {
          let anythingUpdated = false
          // Assign generated playlist ID in case DB data corrupted
          if (playlist._id == null) {
            // {Time now in unix time}-{0-9999}
            playlist._id = generateRandomPlaylistId()
            anythingUpdated = true
          }
          // Ensure all videos has `playlistName` property
          if (playlist.playlistName == null) {
            // Time now in unix time, in ms
            playlist.playlistName = generateRandomPlaylistName()
            anythingUpdated = true
          }
          // Assign current time as created time in case DB data corrupted
          if (playlist.createdAt == null) {
            // Time now in unix time, in ms
            playlist.createdAt = Date.now()
            anythingUpdated = true
          }
          // Assign current time as last updated time in case DB data corrupted
          if (playlist.lastUpdatedAt == null) {
            // Time now in unix time, in ms
            playlist.lastUpdatedAt = Date.now()
            anythingUpdated = true
          }
          playlist.videos.forEach((v) => {
            // Ensure all videos has `timeAdded` property
            if (v.timeAdded == null) {
              v.timeAdded = new Date().getTime()
              anythingUpdated = true
            }

            // Ensure all videos has `playlistItemId` property
            if (v.playlistItemId == null) {
              v.playlistItemId = generateRandomUniqueId()
              anythingUpdated = true
            }

            // For backward compatibility
            if (v.type == null) {
              v.type = 'video'
              anythingUpdated = true
            }

            // Undesired attributes, even with `null` values
            [
              'description',
              'viewCount',
            ].forEach(attrName => {
              if (typeof v[attrName] !== 'undefined') {
                delete v[attrName]
                anythingUpdated = true
              }
            })
          })
          // Save updated playlist object
          if (anythingUpdated) {
            DBPlaylistHandlers.upsert(playlist)
          }
        })

        const favoritesPlaylist = payload.find((playlist) => {
          return playlist.playlistName === 'Favorites' || playlist._id === 'favorites'
        })

        const defaultFavoritesPlaylist = state.defaultPlaylists.find((e) => e._id === 'favorites')
        if (favoritesPlaylist != null) {
          // Update existing matching playlist only if it exists
          if (favoritesPlaylist._id !== defaultFavoritesPlaylist._id || favoritesPlaylist.protected !== defaultFavoritesPlaylist.protected) {
            const oldId = favoritesPlaylist._id
            favoritesPlaylist._id = defaultFavoritesPlaylist._id
            favoritesPlaylist.protected = defaultFavoritesPlaylist.protected
            if (oldId === defaultFavoritesPlaylist._id) {
              // Update playlist if ID already the same
              DBPlaylistHandlers.upsert(favoritesPlaylist)
            } else {
              dispatch('removePlaylist', oldId)
              // DO NOT use dispatch('addPlaylist', ...)
              // Which causes duplicate displayed playlist in window (But DB is fine)
              // Due to the object is already in `payload`
              DBPlaylistHandlers.create(favoritesPlaylist)
            }
          }
        }

        commit('setAllPlaylists', payload)
      }
      commit('setPlaylistsReady', true)
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
      const { _id, playlistItemId } = payload
      await DBPlaylistHandlers.deleteVideoIdByPlaylistId(_id, playlistItemId)
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
      const foundPlaylist = state.playlists[i]
      state.playlists.splice(i, 1, Object.assign(foundPlaylist, updatedPlaylist))
    }
  },

  addVideo(state, payload) {
    const playlist = state.playlists.find(playlist => playlist._id === payload._id)
    if (playlist) {
      playlist.videos.push(payload.videoData)
    }
  },

  addVideos(state, payload) {
    const playlist = state.playlists.find(playlist => playlist._id === payload._id)
    if (playlist) {
      playlist.videos = [].concat(playlist.videos).concat(payload.videos)
    }
  },

  removeAllPlaylists(state) {
    state.playlists = []
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
      playlist.videos = playlist.videos.filter(video => video.playlistItemId !== payload.playlistItemId)
    }
  },

  removeVideos(state, payload) {
    const playlist = state.playlists.find(playlist => playlist._id === payload._id)
    if (playlist) {
      playlist.videos = playlist.videos.filter(video => !payload.videoIds.includes(video.videoId))
    }
  },

  removePlaylist(state, playlistId) {
    state.playlists = state.playlists.filter(playlist => playlist._id !== playlistId || playlist.protected)
  },

  setAllPlaylists(state, payload) {
    state.playlists = payload
  },

  setPlaylistsReady(state, payload) {
    state.playlistsReady = payload
  },
}

export default {
  state,
  getters,
  actions,
  mutations
}
