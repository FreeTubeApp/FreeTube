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

/*
*  Function to find the first playlist with 0 videos, or otherwise the most recently accessed.
*  This is a good default quick bookmark target if one needs to be set.
*/
function findEmptyOrLatestPlayedPlaylist(playlists) {
  const emptyPlaylist = playlists.find((playlist) => playlist.videos.length === 0)
  if (emptyPlaylist) return emptyPlaylist

  let max = -1
  let maxIndex = 0
  for (let i = 0; i < playlists.length; i++) {
    if (playlists[i].lastPlayedAt != null && playlists[i].lastPlayedAt > max) {
      maxIndex = i
      max = playlists[i].lastPlayedAt
    }
  }

  return playlists[maxIndex]
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
      protected: false,
      description: 'Your favorite videos',
      videos: [],
      _id: 'favorites',
    },
    {
      playlistName: 'Watch Later',
      protected: false,
      description: 'Videos to watch later',
      videos: [],
      _id: 'watchLater',
    },
  ],
}

const getters = {
  getPlaylistsReady: (state) => state.playlistsReady,
  getAllPlaylists: (state) => state.playlists,
  getPlaylist: (state) => (playlistId) => {
    return state.playlists.find(playlist => playlist._id === playlistId)
  },
  getQuickBookmarkPlaylist(state, getters) {
    const playlistId = getters.getQuickBookmarkTargetPlaylistId

    if (!playlistId) {
      return undefined
    }

    return state.playlists.find((playlist) => playlist._id === playlistId)
  }
}

const actions = {
  async addPlaylist({ state, commit, rootState, dispatch }, payload) {
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

    const currentTime = new Date().getTime()

    if (Array.isArray(payload.videos)) {
      payload.videos.forEach(videoData => {
        if (videoData.timeAdded == null) {
          videoData.timeAdded = currentTime
        }
        if (videoData.playlistItemId == null) {
          videoData.playlistItemId = generateRandomUniqueId()
        }
      })
    }

    try {
      await DBPlaylistHandlers.create([payload])

      const noQuickBookmarkSet = !rootState.settings.quickBookmarkTargetPlaylistId || !state.playlists.some((playlist) => playlist._id === rootState.settings.quickBookmarkTargetPlaylistId)
      if (noQuickBookmarkSet) {
        dispatch('updateQuickBookmarkTargetPlaylistId', payload._id, { root: true })
      }

      commit('addPlaylist', payload)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async addPlaylists({ state, commit, rootState, dispatch }, payload) {
    try {
      await DBPlaylistHandlers.create(payload)

      const noQuickBookmarkSet = !rootState.settings.quickBookmarkTargetPlaylistId || !state.playlists.some((playlist) => playlist._id === rootState.settings.quickBookmarkTargetPlaylistId)
      if (noQuickBookmarkSet) {
        const chosenPlaylist = findEmptyOrLatestPlayedPlaylist(payload)
        dispatch('updateQuickBookmarkTargetPlaylistId', chosenPlaylist._id, { root: true })
      }

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

      const currentTime = new Date().getTime()

      const newVideoObjects = videos.map((video) => {
        // Create a new object to prevent changing existing values outside
        const videoData = Object.assign({}, video)
        if (videoData.timeAdded == null) {
          videoData.timeAdded = currentTime
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

  async grabAllPlaylists({ rootState, commit, dispatch, state }) {
    try {
      const payload = (await DBPlaylistHandlers.find()).filter((e) => e != null)
      if (payload.length === 0) {
        // Not using `addPlaylists` to ensure required attributes with dynamic values added
        state.defaultPlaylists.forEach(playlist => {
          dispatch('addPlaylist', playlist)
        })
      } else {
        const dateNow = Date.now()
        const currentTime = new Date().getTime()

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
            playlist.createdAt = dateNow
            anythingUpdated = true
          }
          // Assign current time as last updated time in case DB data corrupted
          if (playlist.lastUpdatedAt == null) {
            // Time now in unix time, in ms
            playlist.lastUpdatedAt = dateNow
            anythingUpdated = true
          }
          playlist.videos.forEach((v) => {
            // Ensure all videos has `timeAdded` property
            if (v.timeAdded == null) {
              v.timeAdded = currentTime
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
        const watchLaterPlaylist = payload.find((playlist) => {
          return playlist.playlistName === 'Watch Later' || playlist._id === 'watchLater'
        })

        if (favoritesPlaylist != null) {
          const defaultFavoritesPlaylist = state.defaultPlaylists.find((e) => e._id === 'favorites')

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

        if (watchLaterPlaylist != null) {
          const defaultWatchLaterPlaylist = state.defaultPlaylists.find((e) => e._id === 'watchLater')

          // Update existing matching playlist only if it exists
          if (watchLaterPlaylist._id !== defaultWatchLaterPlaylist._id || watchLaterPlaylist.protected !== defaultWatchLaterPlaylist.protected) {
            const oldId = watchLaterPlaylist._id
            watchLaterPlaylist._id = defaultWatchLaterPlaylist._id
            watchLaterPlaylist.protected = defaultWatchLaterPlaylist.protected
            if (oldId === defaultWatchLaterPlaylist._id) {
              // Update playlist if ID already the same
              DBPlaylistHandlers.upsert(watchLaterPlaylist)
            } else {
              dispatch('removePlaylist', oldId)
              // DO NOT use dispatch('addPlaylist', ...)
              // Which causes duplicate displayed playlist in window (But DB is fine)
              // Due to the object is already in `payload`
              DBPlaylistHandlers.create(watchLaterPlaylist)
            }
          }
        }

        // if no quick bookmark is set, try to find another playlist
        const noQuickBookmarkSet = !rootState.settings.quickBookmarkTargetPlaylistId || !payload.some((playlist) => playlist._id === rootState.settings.quickBookmarkTargetPlaylistId)
        if (noQuickBookmarkSet && payload.length > 0) {
          const chosenPlaylist = findEmptyOrLatestPlayedPlaylist(payload)
          dispatch('updateQuickBookmarkTargetPlaylistId', chosenPlaylist._id, { root: true })
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
      const { _id, videoId, playlistItemId } = payload
      await DBPlaylistHandlers.deleteVideoIdByPlaylistId({ _id, videoId, playlistItemId })
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
  },
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
      playlist.videos = [].concat(playlist.videos, payload.videos)
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

  removeVideo(state, { _id, videoId, playlistItemId }) {
    const playlist = state.playlists.find(playlist => playlist._id === _id)
    if (playlist) {
      if (playlistItemId != null) {
        playlist.videos = playlist.videos.filter(video => video.playlistItemId !== playlistItemId)
      } else if (videoId != null) {
        playlist.videos = playlist.videos.filter(video => video.videoId !== videoId)
      }
    }
  },

  removeVideos(state, { _id, videoId }) {
    const playlist = state.playlists.find(playlist => playlist._id === _id)
    if (playlist) {
      playlist.videos = playlist.videos.filter(video => videoId.indexOf(video) === -1)
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
