import Datastore from 'nedb'

let dbLocation

if (window && window.process && window.process.type === 'renderer') {
  // Electron is being used
  /* let dbLocation = localStorage.getItem('dbLocation')

  if (dbLocation === null) {
    const electron = require('electron')
    dbLocation = electron.remote.app.getPath('userData')
  } */

  const electron = require('electron')
  dbLocation = electron.remote.app.getPath('userData')

  dbLocation = dbLocation + '/profiles.db'
} else {
  dbLocation = 'profiles.db'
}

const profileDb = new Datastore({
  filename: dbLocation,
  autoload: true
})

const state = {
  profileList: [],
  activeProfile: 'allChannels'
}

const getters = {
  getProfileList: () => {
    return state.historyCache
  }
}

const actions = {
  grabAllProfiles ({ dispatch, commit }, defaultName = null) {
    profileDb.find({}, (err, results) => {
      if (!err) {
        if (results.length === 0) {
          dispatch('createDefaultProfile', defaultName)
        } else {
          commit('setProfileList', results)
        }
      }
    })
  },

  async createDefaultProfile ({ dispatch }, defaultName) {
    const randomColor = await dispatch('getRandomColor')
    const textColor = await dispatch('calculateColorLuminance', randomColor)
    const defaultProfile = {
      _id: 'allChannels',
      name: defaultName,
      bgColor: randomColor,
      textColor: textColor,
      subscriptions: []
    }
    console.log(defaultProfile)
    return
    profileDb.update({ _id: 'allChannels' }, defaultProfile, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabAllProfiles')
      }
    })
  },

  updateProfile ({ dispatch }, profile) {
    profileDb.update({ name: profile.name }, profile, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabAllProfiles')
      }
    })
  },

  removeFromHistory ({ dispatch }, videoId) {
    historyDb.remove({ videoId: videoId }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabHistory')
      }
    })
  },

  updateWatchProgress ({ dispatch }, videoData) {
    historyDb.update({ videoId: videoData.videoId }, { $set: { watchProgress: videoData.watchProgress } }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabHistory')
      }
    })
  }
}

const mutations = {
  setHistoryCache (state, historyCache) {
    state.historyCache = historyCache
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
