import Datastore from 'nedb'

let dbLocation

if (window && window.process && window.process.type === 'renderer') {
  // Electron is being used
  let dbLocation = localStorage.getItem('dbLocation')

  if (dbLocation === null) {
    const electron = require('electron')
    dbLocation = electron.remote.app.getPath('userData')
  }

  dbLocation += '/playlists.db'
} else {
  dbLocation = 'playlists.db'
}

const playlistDb = new Datastore({
  filename: dbLocation,
  autoload: true
})

const state = {
  playlists: [
    {
      _id: 'favorites',
      protected: true,
      videos: []
    },
    {
      _id: 'watchLater',
      protected: true,
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
  addPlaylist ({ commit }, payload) {
    playlistDb.insert(payload, (err, payload) => {
      if (err) {
        console.error(err)
      } else {
        commit('addPlaylist', payload)
      }
    })
  },
  addPlaylists ({ commit }, payload) {
    playlistDb.insert(payload, (err, payload) => {
      if (err) {
        console.error(err)
      } else {
        commit('addPlaylists', payload)
      }
    })
  },
  addVideo ({ commit }, payload) {
    playlistDb.update({ _id: payload.playlistId }, { $push: { videos: payload.videoId } }, { upsert: true }, err => {
      if (err) {
        console.error(err)
      } else {
        commit('addVideo', payload)
      }
    })
  },
  addVideos ({ commit }, payload) {
    playlistDb.update({ _id: payload.playlistId }, { $push: { videos: { $each: payload.videosIds } } }, { upsert: true }, err => {
      if (err) {
        console.error(err)
      } else {
        commit('addVideos', payload)
      }
    })
  },
  grabAllPlaylists({ commit }) {
    playlistDb.getAllData((err, payload) => {
      if (err) {
        console.error(err)
      } else {
        commit('setAllPlaylists', payload)
      }
    })
  },
  removeAllPlaylists ({ commit }) {
    playlistDb.remove({ protected: { $ne: true } }, err => {
      if (err) {
        console.error(err)
      } else {
        commit('removeAllPlaylists')
      }
    })
  },
  removeAllVideos ({ commit }, playlistId) {
    playlistDb.update({ _id: playlistId }, { $set: { videos: [] } }, { upsert: true }, err => {
      if (err) {
        console.error(err)
      } else {
        commit('removeAllVideos', playlistId)
      }
    })
  },
  removePlaylist ({ commit }, playlistId) {
    playlistDb.remove({ _id: playlistId, protected: { $ne: true } }, (err, playlistId) => {
      if (err) {
        console.error(err)
      } else {
        commit('removePlaylist', playlistId)
      }
    })
  },
  removePlaylists ({ commit }, playlistIds) {
    playlistDb.remove({ _id: { $in: playlistIds }, protected: { $ne: true } }, (err, playlistIds) => {
      if (err) {
        console.error(err)
      } else {
        commit('removePlaylists', playlistIds)
      }
    })
  },
  removeVideo ({ commit }, payload) {
    playlistDb.update({ _id: payload.playlistId }, { $pull: { videos: payload.videoId } }, { upsert: true }, err => {
      if (err) {
        console.error(err)
      } else {
        commit('removeVideo', payload)
      }
    })
  },
  removeVideos ({ commit }, payload) {
    playlistDb.update({ _id: payload.playlistId }, { $pull: { videos: { $in: payload.videoIds } } }, { upsert: true }, err => {
      if (err) {
        console.error(err)
      } else {
        commit('removeVideos', payload)
      }
    })
  }
}

const mutations = {
  addPlaylist (state, payload) {
    state.playlists.push(payload)
  },
  addPlaylists (state, payload) {
    state.playlists = state.playlists.concat(payload)
  },
  addVideo (state, payload) {
    const playlist = state.playlists.find(playlist => playlist._id === payload.playlistId)
    if (playlist) {
      playlist.videos.push(payload.videoId)
    }
  },
  addVideos (state, payload) {
    const playlist = state.playlists.find(playlist => playlist._id === payload.playlistId)
    if (playlist) {
      playlist.videos = playlist.videos.concat(payload.playlistIds)
    }
  },
  removeAllPlaylists (state) {
    state.playlists = state.playlists.filter(playlist => playlist.protected !== true)
  },
  removeAllVideos (state, playlistId) {
    const playlist = state.playlists.find(playlist => playlist._id === playlistId)
    if (playlist) {
      playlist.videos = []
    }
  },
  removeVideo (state, payload) {
    const playlist = state.playlists.find(playlist => playlist._id === payload.playlistId)
    if (playlist) {
      playlist.videos = playlist.videos.filter(video => video !== payload.videoId)
    }
  },
  removeVideos (state, payload) {
    const playlist = state.playlists.find(playlist => playlist._id === payload.playlistId)
    if (playlist) {
      playlist.videos = playlist.videos.filter(video => payload.videoIds.indexOf(video) === -1)
    }
  },
  removePlaylist (state, playlistId) {
    state.playlists = state.playlists.filter(playlist => playlist._id !== playlistId || playlist.protected)
  },
  setAllPlaylists (state, payload) {
    state.playlists = payload
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
