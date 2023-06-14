import { MAIN_PROFILE_ID } from '../../../constants'

const defaultState = {
  subscriptionsCacheForAllSubscriptionsProfile: {
    videoList: [],
  },
  subscriptionsCacheForActiveProfile: {
    videoList: [],
    profileID: '',
    errorChannels: [],
  },
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const state = {
  subscriptionsCacheForAllSubscriptionsProfile: deepCopy(defaultState.subscriptionsCacheForAllSubscriptionsProfile),
  subscriptionsCacheForActiveProfile: deepCopy(defaultState.subscriptionsCacheForActiveProfile),
}

const getters = {
  getSubscriptionsCacheForAllSubscriptionsProfile: () => {
    return state.subscriptionsCacheForAllSubscriptionsProfile
  },
  getSubscriptionsCacheForProfile: (state) => (profileId) => {
    if (state.subscriptionsCacheForActiveProfile.profileID !== profileId) { return null }

    return state.subscriptionsCacheForActiveProfile
  },
}

const actions = {
  updateSubscriptionsCacheForActiveProfile: ({ commit }, payload) => {
    if (payload.profileID === MAIN_PROFILE_ID) {
      commit('updateSubscriptionsCacheForAllSubscriptionsProfile', {
        videoList: payload.videoList,
      })
    } else {
      // When cache for a non default profile (the one for all subscriptions) updated
      // The cache for all subscriptions could be stale at that point
      commit('clearSubscriptionsCacheForAllSubscriptionsProfile')
    }

    commit('updateSubscriptionsCacheForActiveProfile', payload)
  },
  clearSubscriptionsCache: ({ commit }) => {
    commit('clearSubscriptionsCacheForAllSubscriptionsProfile')
    commit('clearSubscriptionsCacheForActiveProfile')
  },
}

const mutations = {
  updateSubscriptionsCacheForAllSubscriptionsProfile (state, { videoList }) {
    state.subscriptionsCacheForAllSubscriptionsProfile.videoList = videoList
  },
  updateSubscriptionsCacheForActiveProfile (state, { profileID, videoList, errorChannels }) {
    state.subscriptionsCacheForActiveProfile.profileID = profileID
    state.subscriptionsCacheForActiveProfile.videoList = videoList
    state.subscriptionsCacheForActiveProfile.errorChannels = errorChannels
  },
  clearSubscriptionsCacheForAllSubscriptionsProfile (state) {
    state.subscriptionsCacheForAllSubscriptionsProfile = deepCopy(defaultState.subscriptionsCacheForAllSubscriptionsProfile)
  },
  clearSubscriptionsCacheForActiveProfile (state) {
    state.subscriptionsCacheForActiveProfile = deepCopy(defaultState.subscriptionsCacheForActiveProfile)
  },
}

export default {
  state,
  getters,
  actions,
  mutations
}
