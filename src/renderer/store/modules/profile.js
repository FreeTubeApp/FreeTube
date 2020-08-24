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
    return state.profileList
  }
}

const actions = {
  grabAllProfiles ({ dispatch, commit }, defaultName = null) {
    profileDb.find({}, (err, results) => {
      if (!err) {
        console.log(results)
        if (results.length === 0) {
          dispatch('createDefaultProfile', defaultName)
        } else {
          commit('setProfileList', results)
        }
      }
    })
  },

  grabProfileInfo (_, profileId) {
    return new Promise((resolve, reject) => {
      console.log(profileId)
      profileDb.findOne({ _id: profileId }, (err, results) => {
        if (!err) {
          resolve(results)
        }
      })
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
    profileDb.update({ _id: 'allChannels' }, defaultProfile, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabAllProfiles')
      }
    })
  },

  updateProfile ({ dispatch }, profile) {
    profileDb.update({ _id: profile._id }, profile, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabAllProfiles')
      }
    })
  },

  insertProfile ({ dispatch }, profile) {
    profileDb.insert(profile, (err, newDocs) => {
      if (!err) {
        dispatch('grabAllProfiles')
      }
    })
  },

  removeProfile ({ dispatch }, videoId) {
    profileDb.remove({ videoId: videoId }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabHistory')
      }
    })
  }
}

const mutations = {
  setProfileList (state, profileList) {
    state.profileList = profileList
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
