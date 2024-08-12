import { MAIN_PROFILE_ID } from '../../../constants'
import { DBProfileHandlers } from '../../../datastores/handlers/index'
import { calculateColorLuminance, getRandomColor } from '../../helpers/colors'
import { deepCopy } from '../../helpers/utils'

const state = {
  profileList: [{
    _id: MAIN_PROFILE_ID,
    name: 'All Channels',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    subscriptions: []
  }],
  activeProfile: MAIN_PROFILE_ID
}

const getters = {
  getProfileList: (state) => {
    return state.profileList
  },

  getActiveProfile: (state) => {
    const activeProfileId = state.activeProfile
    return state.profileList.find((profile) => {
      return profile._id === activeProfileId
    })
  },

  profileById: (state) => (id) => {
    const profile = state.profileList.find(p => p._id === id)
    return profile
  }
}

function profileSort(a, b) {
  if (a._id === MAIN_PROFILE_ID) return -1
  if (b._id === MAIN_PROFILE_ID) return 1
  if (a.name < b.name) return -1
  if (a.name > b.name) return 1
  return 0
}

const actions = {
  async grabAllProfiles({ rootState, commit }, defaultName = null) {
    let profiles
    try {
      profiles = await DBProfileHandlers.find()
    } catch (errMessage) {
      console.error(errMessage)
      return
    }

    if (!Array.isArray(profiles)) return

    if (profiles.length === 0) {
      // Create a default profile and persist it
      const randomColor = getRandomColor().value
      const textColor = calculateColorLuminance(randomColor)
      const defaultProfile = {
        _id: MAIN_PROFILE_ID,
        name: defaultName,
        bgColor: randomColor,
        textColor: textColor,
        subscriptions: []
      }

      try {
        await DBProfileHandlers.create(defaultProfile)
        commit('setProfileList', [defaultProfile])
      } catch (errMessage) {
        console.error(errMessage)
      }

      return
    }

    // We want the primary profile to always be first
    // So sort with that then sort alphabetically by profile name
    profiles = profiles.sort(profileSort)

    if (state.profileList.length < profiles.length) {
      const profile = profiles.find((profile) => {
        return profile._id === rootState.settings.defaultProfile
      })

      if (profile) {
        commit('setActiveProfile', profile._id)
      }
    }

    commit('setProfileList', profiles)
  },

  async batchUpdateSubscriptionDetails({ dispatch, state }, channels) {
    if (channels.length === 0) { return }

    const profileList = state.profileList

    for (const profile of profileList) {
      const currentProfileCopy = deepCopy(profile)
      let profileUpdated = false

      for (const { channelThumbnailUrl, channelName, channelId } of channels) {
        const channel = currentProfileCopy.subscriptions.find((channel) => {
          return channel.id === channelId
        }) ?? null

        if (channel === null) { continue }

        if (channel.name !== channelName && channelName != null) {
          channel.name = channelName
          profileUpdated = true
        }

        if (channelThumbnailUrl) {
          const thumbnail = channelThumbnailUrl.replace(/=s\d*/, '=s176') // change thumbnail size if different

          if (channel.thumbnail !== thumbnail) {
            channel.thumbnail = thumbnail
            profileUpdated = true
          }
        }
      }

      if (profileUpdated) {
        await dispatch('updateProfile', currentProfileCopy)
      }
    }
  },

  async updateSubscriptionDetails({ dispatch, state }, { channelThumbnailUrl, channelName, channelId }) {
    const thumbnail = channelThumbnailUrl?.replace(/=s\d*/, '=s176') ?? null // change thumbnail size if different
    const profileList = state.profileList
    for (const profile of profileList) {
      const currentProfileCopy = deepCopy(profile)
      const channel = currentProfileCopy.subscriptions.find((channel) => {
        return channel.id === channelId
      }) ?? null
      if (channel === null) { continue }
      let updated = false
      if (channel.name !== channelName && channelName != null) {
        channel.name = channelName
        updated = true
      }
      if (channel.thumbnail !== thumbnail && thumbnail != null) {
        channel.thumbnail = thumbnail
        updated = true
      }
      if (updated) {
        await dispatch('updateProfile', currentProfileCopy)
      } else { // channel has not been updated, stop iterating through profiles
        break
      }
    }
  },

  async createProfile({ commit }, profile) {
    try {
      const newProfile = await DBProfileHandlers.create(profile)
      commit('addProfileToList', newProfile)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async updateProfile({ commit }, profile) {
    try {
      await DBProfileHandlers.upsert(profile)
      commit('upsertProfileToList', profile)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async addChannelToProfiles({ commit }, { channel, profileIds }) {
    try {
      await DBProfileHandlers.addChannelToProfiles(channel, profileIds)
      commit('addChannelToProfiles', { channel, profileIds })
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeChannelFromProfiles({ commit }, { channelId, profileIds }) {
    try {
      await DBProfileHandlers.removeChannelFromProfiles(channelId, profileIds)
      commit('removeChannelFromProfiles', { channelId, profileIds })
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  async removeProfile({ commit }, profileId) {
    try {
      await DBProfileHandlers.delete(profileId)
      commit('removeProfileFromList', profileId)
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  updateActiveProfile({ commit }, id) {
    commit('setActiveProfile', id)
  }
}

const mutations = {
  setProfileList(state, profileList) {
    state.profileList = profileList
  },

  setActiveProfile(state, activeProfile) {
    state.activeProfile = activeProfile
  },

  addProfileToList(state, profile) {
    state.profileList.push(profile)
    state.profileList.sort(profileSort)
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

    state.profileList.sort(profileSort)
  },

  addChannelToProfiles(state, { channel, profileIds }) {
    for (const id of profileIds) {
      state.profileList.find(profile => profile._id === id).subscriptions.push(channel)
    }
  },

  removeChannelFromProfiles(state, { channelId, profileIds }) {
    for (const id of profileIds) {
      const profile = state.profileList.find(profile => profile._id === id)

      // use filter instead of splice in case the subscription appears multiple times
      // https://github.com/FreeTubeApp/FreeTube/pull/3468#discussion_r1179290877
      profile.subscriptions = profile.subscriptions.filter(channel => channel.id !== channelId)
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
