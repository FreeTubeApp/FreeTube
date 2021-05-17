import Datastore from 'nedb'

let dbLocation

if (window && window.process && window.process.type === 'renderer') {
  // Electron is being used
  /* let dbLocation = localStorage.getItem('dbLocation')

  if (dbLocation === null) {
    const electron = require('electron')
    dbLocation = electron.remote.app.getPath('userData')
  } */

  const remote = require('@electron/remote')
  dbLocation = remote.app.getPath('userData')

  dbLocation = dbLocation + '/profiles.db'
} else {
  dbLocation = 'profiles.db'
}

const profileDb = new Datastore({
  filename: dbLocation,
  autoload: true
})

const state = {
  profileList: [{
    _id: 'allChannels',
    name: 'All Channels',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    subscriptions: []
  }],
  activeProfile: 0
}

const getters = {
  getProfileList: () => {
    return state.profileList
  },

  getActiveProfile: () => {
    return state.activeProfile
  }
}

const actions = {
  grabAllProfiles ({ rootState, dispatch, commit }, defaultName = null) {
    return new Promise((resolve, reject) => {
      profileDb.find({}, (err, results) => {
        if (!err) {
          if (results.length === 0) {
            dispatch('createDefaultProfile', defaultName)
          } else {
            // We want the primary profile to always be first
            // So sort with that then sort alphabetically by profile name
            const profiles = results.sort((a, b) => {
              if (a._id === 'allChannels') {
                return -1
              }

              if (b._id === 'allChannels') {
                return 1
              }

              return b.name - a.name
            })

            if (state.profileList.length < profiles.length) {
              const profileIndex = profiles.findIndex((profile) => {
                return profile._id === rootState.settings.defaultProfile
              })

              if (profileIndex !== -1) {
                commit('setActiveProfile', profileIndex)
              }
            }

            commit('setProfileList', profiles)
          }

          resolve()
        } else {
          reject(err)
        }
      })
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

  removeProfile ({ dispatch }, profileId) {
    profileDb.remove({ _id: profileId }, (err, numReplaced) => {
      if (!err) {
        dispatch('grabAllProfiles')
      }
    })
  },

  compactProfiles (_) {
    profileDb.persistence.compactDatafile()
  },

  updateActiveProfile ({ commit }, index) {
    commit('setActiveProfile', index)
  }
}

const mutations = {
  setProfileList (state, profileList) {
    state.profileList = profileList
  },
  setActiveProfile (state, activeProfile) {
    state.activeProfile = activeProfile
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
