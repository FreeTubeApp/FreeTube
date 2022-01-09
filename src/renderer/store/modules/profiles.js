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
  }
}

const actions = {
  async grabAllProfiles({ rootState, dispatch, commit }, defaultName = null) {
    let profiles = await profilesDb.find({})
    if (profiles.length === 0) {
      dispatch('createDefaultProfile', defaultName)
      return
    }
    // We want the primary profile to always be first
    // So sort with that then sort alphabetically by profile name
    profiles = profiles.sort((a, b) => {
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
  },

  async grabProfileInfo(_, profileId) {
    console.log(profileId)
    return await profilesDb.findOne({ _id: profileId })
  },

  async updateChannelThumbnail({ getters, dispatch }, data) {
    const profileList = getters.getProfileList
    console.log('get profile list')
    console.log(profileList.length)
    const thumbnail = data.channelThumbnailUrl
    const channelName = data.channelName
    const channelId = data.channelId
    console.log(data)
    for (let i = 0; i < profileList.length; i++) {
      const currentProfile = JSON.parse(JSON.stringify(profileList[i]))
      console.log(thumbnail)
      const channelIndex = currentProfile.subscriptions.findIndex((channel) => {
        return channel.id === channelId
      })
      if (channelIndex !== -1) {
        console.log('channel found')
        let updated = false
        if (profileList[i].subscriptions[channelIndex].name !== channelName) {
          currentProfile.subscriptions[channelIndex].name = channelName
          updated = true
        }
        if (profileList[i].subscriptions[channelIndex].thumbnail !== thumbnail) {
          currentProfile.subscriptions[channelIndex].thumbnail = thumbnail
          updated = true
        }
        if (updated) {
          await dispatch('updateProfile', currentProfile)
        } else {
          break
        }
      }
    }
  },

  async createDefaultProfile({ dispatch }, defaultName) {
    const randomColor = await dispatch('getRandomColor')
    const textColor = await dispatch('calculateColorLuminance', randomColor)
    const defaultProfile = {
      _id: 'allChannels',
      name: defaultName,
      bgColor: randomColor,
      textColor: textColor,
      subscriptions: []
    }

    await profilesDb.update(
      { _id: 'allChannels' },
      defaultProfile,
      { upsert: true }
    )
    dispatch('grabAllProfiles')
  },

  async updateProfile({ dispatch }, profile) {
    await profilesDb.update(
      { _id: profile._id },
      profile,
      { upsert: true }
    )
    dispatch('grabAllProfiles')
  },

  async insertProfile({ dispatch }, profile) {
    await profilesDb.insert(profile)
    dispatch('grabAllProfiles')
  },

  async removeProfile({ dispatch }, profileId) {
    await profilesDb.remove({ _id: profileId })
    dispatch('grabAllProfiles')
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
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
