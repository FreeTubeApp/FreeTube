const defaultCacheEntryValueForForOneChannel = {
  videos: null,
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const state = {
  subscriptionsCachePerChannel: {},
}

const getters = {
  getSubscriptionsCacheEntriesForOneChannel: (state) => (channelId) => {
    return state.subscriptionsCachePerChannel[channelId]
  },
}

const actions = {
  clearSubscriptionsCache: ({ commit }) => {
    commit('clearSubscriptionsCachePerChannel')
  },

  updateSubscriptionsCacheForOneChannel: ({ commit }, payload) => {
    commit('updateSubscriptionsCacheForOneChannel', payload)
  },
}

const mutations = {
  updateSubscriptionsCacheForOneChannel(state, { channelId, videos }) {
    const existingObject = state.subscriptionsCachePerChannel[channelId]
    const newObject = existingObject != null ? existingObject : deepCopy(defaultCacheEntryValueForForOneChannel)
    if (videos != null) { newObject.videos = videos }
    state.subscriptionsCachePerChannel[channelId] = newObject
  },
  clearSubscriptionsCachePerChannel(state) {
    state.subscriptionsCachePerChannel = {}
  },
}

export default {
  state,
  getters,
  actions,
  mutations
}
