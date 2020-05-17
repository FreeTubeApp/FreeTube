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

const subDb = new Datastore({
  filename: dbLocation,
  autoload: true
})

const state = {
  activePlaylistId: '',
  activePlaylistVideoList: [],
  watchedVideosWithinPlaylist: []
}

const mutations = {
  addSubscription (state, payload) {
    state.subscriptions.push(payload)
  },
  setSubscriptions (state, payload) {
    state.subscriptions = payload
  }
}

const actions = {
  addSubscriptions ({ commit }, payload) {
    subDb.insert(payload, (err, payload) => {
      if (!err) {
        commit('addSubscription', payload)
      }
    })
  },
  getSubscriptions ({ commit }, payload) {
    subDb.find({}, (err, payload) => {
      if (!err) {
        commit('setSubscriptions', payload)
      }
    })
  },
  removeSubscription ({ commit }, channelId) {
    subDb.remove({ channelId: channelId }, {}, () => {
      commit('setSubscriptions', this.state.subscriptions.filter(sub => sub.channelId !== channelId))
    })
  }
}
const getters = {}
export default {
  state,
  getters,
  actions,
  mutations
}
