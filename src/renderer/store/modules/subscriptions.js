const state = {
  videoCache: {},
  liveCache: {},
  shortsCache: {},
  postsCache: {}
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
  },

  getPostsCache: (state) => {
    return state.postsCache
  },

  getPostsCacheByChannel: (state) => (channelId) => {
    return state.postsCache[channelId]
  },
}

const actions = {
  updateSubscriptionVideosCacheByChannel: ({ commit }, payload) => {
    commit('updateVideoCacheByChannel', payload)
  },

  updateSubscriptionShortsCacheByChannel: ({ commit }, payload) => {
    commit('updateShortsCacheByChannel', payload)
  },

  updateSubscriptionShortsCacheWithChannelPageShorts: ({ commit }, payload) => {
    commit('updateShortsCacheWithChannelPageShorts', payload)
  },

  updateSubscriptionLiveCacheByChannel: ({ commit }, payload) => {
    commit('updateLiveCacheByChannel', payload)
  },

  updateSubscriptionPostsCacheByChannel: ({ commit }, payload) => {
    commit('updatePostsCacheByChannel', payload)
  },

  clearSubscriptionsCache: ({ commit }, payload) => {
    commit('clearVideoCache', payload)
    commit('clearShortsCache', payload)
    commit('clearLiveCache', payload)
    commit('clearPostsCache', payload)
  },
}

const mutations = {
  updateVideoCacheByChannel(state, { channelId, videos, timestamp }) {
    const existingObject = state.videoCache[channelId]
    const newObject = existingObject ?? { videos: null }
    if (videos != null) { newObject.videos = videos }
    if (timestamp != null) newObject.timestamp = timestamp
    state.videoCache[channelId] = newObject
  },
  clearVideoCache(state) {
    state.videoCache = {}
  },
  updateShortsCacheByChannel(state, { channelId, videos, timestamp }) {
    const existingObject = state.shortsCache[channelId]
    const newObject = existingObject ?? { videos: null }
    if (videos != null) { newObject.videos = videos }
    if (timestamp != null) newObject.timestamp = timestamp
    state.shortsCache[channelId] = newObject
  },
  updateShortsCacheWithChannelPageShorts(state, { channelId, videos }) {
    const cachedObject = state.shortsCache[channelId]

    if (cachedObject && cachedObject.videos.length > 0) {
      cachedObject.videos.forEach(cachedVideo => {
        const channelVideo = videos.find(short => cachedVideo.videoId === short.videoId)

        if (channelVideo) {
          // authorId probably never changes, so we don't need to update that

          cachedVideo.title = channelVideo.title
          cachedVideo.author = channelVideo.author

          // as the channel shorts page only has compact view counts for numbers above 1000 e.g. 12k
          // and the RSS feeds include an exact value, we only want to overwrite it when the number is larger than the cached value
          // 12345 vs 12000 => 12345
          // 12345 vs 15000 => 15000

          if (channelVideo.viewCount > cachedVideo.viewCount) {
            cachedVideo.viewCount = channelVideo.viewCount
          }
        }
      })
    }
  },
  clearShortsCache(state) {
    state.shortsCache = {}
  },
  updateLiveCacheByChannel(state, { channelId, videos, timestamp }) {
    const existingObject = state.liveCache[channelId]
    const newObject = existingObject ?? { videos: null }
    if (videos != null) { newObject.videos = videos }
    if (timestamp != null) newObject.timestamp = timestamp
    state.liveCache[channelId] = newObject
  },
  clearLiveCache(state) {
    state.liveCache = {}
  },
  updatePostsCacheByChannel(state, { channelId, posts, timestamp }) {
    const existingObject = state.postsCache[channelId]
    const newObject = existingObject ?? { posts: null }
    if (posts != null) { newObject.posts = posts }
    if (timestamp != null) newObject.timestamp = timestamp
    state.postsCache[channelId] = newObject
  },
  clearPostsCache(state) {
    state.postsCache = {}
  },
}

export default {
  state,
  getters,
  actions,
  mutations
}
