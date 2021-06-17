import { playlistsDb } from '../datastores'

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
    await playlistsDb.insert(payload)
    commit('addPlaylist', payload)
  },

  async addPlaylists({ commit }, payload) {
    await playlistsDb.insert(payload)
    commit('addPlaylists', payload)
  },

  async addVideo({ commit }, payload) {
    await playlistsDb.update(
      { playlistName: payload.playlistName },
      { $push: { videos: payload.videoData } },
      { upsert: true }
    )
    commit('addVideo', payload)
  },

  async addVideos({ commit }, payload) {
    await playlistsDb.update(
      { _id: payload.playlistId },
      { $push: { videos: { $each: payload.videosIds } } },
      { upsert: true }
    )
    commit('addVideos', payload)
  },

  async grabAllPlaylists({ commit, dispatch }) {
    const payload = await playlistsDb.find({})
    if (payload.length === 0) {
      commit('setAllPlaylists', state.playlists)
      dispatch('addPlaylists', payload)
    } else {
      commit('setAllPlaylists', payload)
    }
  },

  async removeAllPlaylists({ commit }) {
    await playlistsDb.remove({ protected: { $ne: true } })
    commit('removeAllPlaylists')
  },

  async removeAllVideos({ commit }, playlistName) {
    await playlistsDb.update(
      { playlistName: playlistName },
      { $set: { videos: [] } },
      { upsert: true }
    )
    commit('removeAllVideos', playlistName)
  },

  async removePlaylist({ commit }, playlistId) {
    await playlistsDb.remove({
      _id: playlistId,
      protected: { $ne: true }
    })
    commit('removePlaylist', playlistId)
  },

  async removePlaylists({ commit }, playlistIds) {
    await playlistsDb.remove({
      _id: { $in: playlistIds },
      protected: { $ne: true }
    })
    commit('removePlaylists', playlistIds)
  },

  async removeVideo({ commit }, payload) {
    await playlistsDb.update(
      { playlistName: payload.playlistName },
      { $pull: { videos: { videoId: payload.videoId } } },
      { upsert: true }
    )
    commit('removeVideo', payload)
  },

  async removeVideos({ commit }, payload) {
    await playlistsDb.update(
      { _id: payload.playlistName },
      { $pull: { videos: { $in: payload.videoId } } },
      { upsert: true }
    )
    commit('removeVideos', payload)
  }
}

const mutations = {
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
