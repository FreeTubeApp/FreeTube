import { profilesDb } from '../datastores'

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
  },

  profileById: (state) => (id) => {
    const profile = state.profileList.find(p => p._id === id)
    return profile
  }
}

function profileSort(a, b) {
  if (a._id === 'allChannels') return -1
  if (b._id === 'allChannels') return 1
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return 0
}

const actions = {
  async grabAllProfiles({ rootState, dispatch, commit }, defaultName = null) {
    let profiles = await profilesDb.find({}).catch(console.error)
    if (!Array.isArray(profiles)) return

    if (profiles.length === 0) {
      // Create a default profile and persist it
      const randomColor = await dispatch('getRandomColor')
      const textColor = await dispatch('calculateColorLuminance', randomColor)
      const defaultProfile = {
        _id: 'allChannels',
        name: defaultName,
        bgColor: randomColor,
        textColor: textColor,
        subscriptions: []
      }

      await profilesDb.insert(defaultProfile).catch(console.error)
      commit('setProfileList', [defaultProfile])
      return
    }

    // We want the primary profile to always be first
    // So sort with that then sort alphabetically by profile name
    profiles = profiles.sort(profileSort)

    if (state.profileList.length < profiles.length) {
      const profileIndex = profiles.findIndex((profile) => {
        return profile._id === rootState.settings.defaultProfile
      })

      if (profileIndex !== -1) {
        commit('setActiveProfile', profileIndex)
      }
    }

    commit('setProfileList', profiles)
  },

  updateProfile({ commit }, profile) {
    profilesDb.update(
      { _id: profile._id },
      profile,
      { upsert: true }
    ).catch(console.error)
    commit('upsertProfileToList', profile)
  },

  removeProfile({ commit }, profileId) {
    profilesDb.remove({ _id: profileId }).catch(console.error)
    commit('removeProfileFromList', profileId)
  },

  compactProfiles(_) {
    profilesDb.persistence.compactDatafile()
  },

  updateActiveProfile({ commit }, index) {
    commit('setActiveProfile', index)
  }
}

const mutations = {
  setProfileList(state, profileList) {
    state.profileList = profileList
  },

  setActiveProfile(state, activeProfile) {
    state.activeProfile = activeProfile
  },

  upsertProfileToList(state, updatedProfile) {
    const i = state.profileList.findIndex((p) => {
      return p._id === updatedProfile._id
    })

    if (i === -1) {
      state.profileList.push(updatedProfile)
    } else {
      state.profileList.splice(i, 1, updatedProfile)
    }
  },

  removeProfileFromList(state, profileId) {
    const i = state.profileList.findIndex((profile) => {
      return profile._id === profileId
    })

    state.profileList.splice(i, 1)
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
