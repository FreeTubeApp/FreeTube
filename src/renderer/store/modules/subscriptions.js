const defaultCacheEntryValueForForOneChannel = {
  videos: null,
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const state = {
  videoCache: {},
  liveCache: {},
  shortsCache: {}
}

const getters = {
  getVideoCache: (state) => {
    return state.videoCache
  },

  getVideoCacheByChannel: (state) => (channelId) => {
    return state.videoCache[channelId]
  },

  getShortsCache: (state) => {
    return state.shortsCache
  },

  getShortsCacheByChannel: (state) => (channelId) => {
    return state.shortsCache[channelId]
  },

  getLiveCache: (state) => {
    return state.liveCache
  },

  getLiveCacheByChannel: (state) => (channelId) => {
    return state.liveCache[channelId]
  }
}

const actions = {
  clearSubscriptionVideosCache: ({ commit }) => {
    commit('clearVideoCache')
  },

  updateSubscriptionVideosCacheByChannel: ({ commit }, payload) => {
    commit('updateVideoCacheByChannel', payload)
  },

  clearSubscriptionShortsCache: ({ commit }) => {
    commit('clearShortsCache')
  },

  updateSubscriptionShortsCacheByChannel: ({ commit }, payload) => {
    commit('updateShortsCacheByChannel', payload)
  },

  clearSubscriptionLiveCache: ({ commit }) => {
    commit('clearLiveCache')
  },

  updateSubscriptionLiveCacheByChannel: ({ commit }, payload) => {
    commit('updateLiveCacheByChannel', payload)
  }
}

const mutations = {
  updateVideoCacheByChannel(state, { channelId, videos }) {
    const existingObject = state.videoCache[channelId]
    const newObject = existingObject != null ? existingObject : deepCopy(defaultCacheEntryValueForForOneChannel)
    if (videos != null) { newObject.videos = videos }
    state.videoCache[channelId] = newObject
  },
  clearVideoCache(state) {
    state.videoCache = {}
  },
  updateShortsCacheByChannel(state, { channelId, videos }) {
    const existingObject = state.shortsCache[channelId]
    const newObject = existingObject != null ? existingObject : deepCopy(defaultCacheEntryValueForForOneChannel)
    if (videos != null) { newObject.videos = videos }
    state.shortsCache[channelId] = newObject
  },
  clearShortsCache(state) {
    state.shortsCache = {}
  },
  updateLiveCacheByChannel(state, { channelId, videos }) {
    const existingObject = state.liveCache[channelId]
    const newObject = existingObject != null ? existingObject : deepCopy(defaultCacheEntryValueForForOneChannel)
    if (videos != null) { newObject.videos = videos }
    state.liveCache[channelId] = newObject
  },
  clearLiveCache(state) {
    state.liveCache = {}
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
