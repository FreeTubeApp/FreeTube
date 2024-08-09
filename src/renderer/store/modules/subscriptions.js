const state = {
  videoCache: {},
  liveCache: {},
  shortsCache: {},
  postsCache: {}
}

const getters = {
  /** @param {typeof state} state */
  getVideoCache: (state) => {
    return state.videoCache
  },

  /** @param {typeof state} state */
  getVideoCacheByChannel: (state) => (/** @type {string} */channelId) => {
    return state.videoCache[channelId]
  },

  /** @param {typeof state} state */
  getShortsCache: (state) => {
    return state.shortsCache
  },

  /** @param {typeof state} state */
  getShortsCacheByChannel: (state) => (/** @type {string} */channelId) => {
    return state.shortsCache[channelId]
  },

  /** @param {typeof state} state */
  getLiveCache: (state) => {
    return state.liveCache
    /** @param {typeof state} state */
  },

  /** @param {typeof state} state */
  getLiveCacheByChannel: (state) => (/** @type {string} */channelId) => {
    return state.liveCache[channelId]
  },

  /** @param {typeof state} state */
  getPostsCache: (state) => {
    return state.postsCache
  },

  /** @param {typeof state} state */
  getPostsCacheByChannel: (state) => (/** @type {string} */channelId) => {
    return state.postsCache[channelId]
  },
}

const actions = {
  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string} payload.channelId
   * @param {any[]} payload.videos
   * @param {any} payload.timestamp
   */
  updateSubscriptionVideosCacheByChannel: ({ commit }, payload) => {
    commit('updateVideoCacheByChannel', payload)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string} payload.channelId
   * @param {any[]} payload.videos
   * @param {any} payload.timestamp
   */
  updateSubscriptionShortsCacheByChannel: ({ commit }, payload) => {
    commit('updateShortsCacheByChannel', payload)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string} payload.channelId
   * @param {string} payload.videos
   */
  updateSubscriptionShortsCacheWithChannelPageShorts: ({ commit }, payload) => {
    commit('updateShortsCacheWithChannelPageShorts', payload)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string} payload.channelId
   * @param {any[]} payload.videos
   * @param {any} payload.timestamp
   */
  updateSubscriptionLiveCacheByChannel: ({ commit }, payload) => {
    commit('updateLiveCacheByChannel', payload)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string} payload.channelId
   * @param {any[]} payload.posts
   * @param {any} payload.timestamp
   */
  updateSubscriptionPostsCacheByChannel: ({ commit }, payload) => {
    commit('updatePostsCacheByChannel', payload)
  },

  /** @param {import('../types/store').ActionContext<typeof state>} context */
  clearSubscriptionsCache: ({ commit }) => {
    commit('clearCaches')
  },
}

const mutations = {
  /**
   * @param {typeof state} state
   * @param {Object} payload
   * @param {string} payload.channelId
   * @param {any[]} payload.videos
   * @param {Date} [payload.timestamp=new Date()]
   */
  updateVideoCacheByChannel(state, { channelId, videos, timestamp = new Date() }) {
    const existingObject = state.videoCache[channelId]
    const newObject = existingObject ?? { videos: null }
    if (videos != null) { newObject.videos = videos }
    newObject.timestamp = timestamp
    state.videoCache[channelId] = newObject
  },
  /**
   * @param {typeof state} state
   * @param {Object} payload
   * @param {string} payload.channelId
   * @param {any[]} payload.videos
   * @param {Date} [payload.timestamp=new Date()]
   */
  updateShortsCacheByChannel(state, { channelId, videos, timestamp = new Date() }) {
    const existingObject = state.shortsCache[channelId]
    const newObject = existingObject ?? { videos: null }
    if (videos != null) { newObject.videos = videos }
    newObject.timestamp = timestamp
    state.shortsCache[channelId] = newObject
  },
  /**
   * @param {typeof state} state
   * @param {Object} payload
   * @param {string} payload.channelId
   * @param {string} payload.videos
   */
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
  /**
   * @param {typeof state} state
   * @param {Object} payload
   * @param {string} payload.channelId
   * @param {any[]} payload.videos
   * @param {Date} [payload.timestamp=new Date()]
   */
  updateLiveCacheByChannel(state, { channelId, videos, timestamp = new Date() }) {
    const existingObject = state.liveCache[channelId]
    const newObject = existingObject ?? { videos: null }
    if (videos != null) { newObject.videos = videos }
    newObject.timestamp = timestamp
    state.liveCache[channelId] = newObject
  },
  /**
   * @param {typeof state} state
   * @param {Object} payload
   * @param {string} payload.channelId
   * @param {any[]} payload.posts
   * @param {Date} [payload.timestamp=new Date()]
   */
  updatePostsCacheByChannel(state, { channelId, posts, timestamp = new Date() }) {
    const existingObject = state.postsCache[channelId]
    const newObject = existingObject ?? { posts: null }
    if (posts != null) { newObject.posts = posts }
    newObject.timestamp = timestamp
    state.postsCache[channelId] = newObject
  },

  /** @param {typeof state} state */
  clearCaches(state) {
    state.videoCache = {}
    state.shortsCache = {}
    state.liveCache = {}
    state.postsCache = {}
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
