import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import SubscriptionsTabUI from '../SubscriptionsTabUi/SubscriptionsTabUi.vue'

import { copyToClipboard, getRelativeTimeFromDate, showToast } from '../../helpers/utils'
import { getLocalChannelCommunity } from '../../helpers/api/local'
import { invidiousGetCommunityPosts } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'SubscriptionsCommunity',
  components: {
    'subscriptions-tab-ui': SubscriptionsTabUI
  },
  data: function () {
    return {
      isLoading: true,
      alreadyLoadedRemotely: false,
      postList: [],
      errorChannels: [],
      attemptedFetch: false,
      lastRemoteRefreshSuccessTimestamp: null,
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
    },

    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    activeProfileId: function () {
      return this.activeProfile._id
    },

    subscriptionCacheReady: function () {
      return this.$store.getters.getSubscriptionCacheReady
    },

    cacheEntriesForAllActiveProfileChannels() {
      const entries = []
      this.activeSubscriptionList.forEach((channel) => {
        const cacheEntry = this.$store.getters.getPostsCacheByChannel(channel.id)
        if (cacheEntry == null) { return }

        entries.push(cacheEntry)
      })
      return entries
    },

    lastCommunityRefreshTimestamp: function () {
      // Cache is not ready when data is just loaded from remote
      if (this.lastRemoteRefreshSuccessTimestamp) {
        return getRelativeTimeFromDate(this.lastRemoteRefreshSuccessTimestamp, true)
      }
      if (!this.postCacheForAllActiveProfileChannelsPresent) { return '' }
      if (this.cacheEntriesForAllActiveProfileChannels.length === 0) { return '' }

      let minTimestamp = null
      this.cacheEntriesForAllActiveProfileChannels.forEach((cacheEntry) => {
        if (!minTimestamp || cacheEntry.timestamp.getTime() < minTimestamp.getTime()) {
          minTimestamp = cacheEntry.timestamp
        }
      })
      return getRelativeTimeFromDate(minTimestamp, true)
    },

    postCacheForAllActiveProfileChannelsPresent() {
      if (this.cacheEntriesForAllActiveProfileChannels.length === 0) { return false }
      if (this.cacheEntriesForAllActiveProfileChannels.length < this.activeSubscriptionList.length) { return false }

      return this.cacheEntriesForAllActiveProfileChannels.every((cacheEntry) => {
        return cacheEntry.posts != null
      })
    },

    activeSubscriptionList: function () {
      return this.activeProfile.subscriptions
    },

    fetchSubscriptionsAutomatically: function() {
      return this.$store.getters.getFetchSubscriptionsAutomatically
    },
  },
  watch: {
    activeProfile: async function (_) {
      this.lastRemoteRefreshSuccessTimestamp = null
      this.isLoading = true
      this.loadPostsFromCacheSometimes()
    },

    subscriptionCacheReady() {
      if (!this.alreadyLoadedRemotely) {
        this.loadPostsFromCacheSometimes()
      }
    },
  },
  mounted: async function () {
    this.loadPostsFromRemoteFirstPerWindowSometimes()
  },
  methods: {
    loadPostsFromRemoteFirstPerWindowSometimes() {
      if (!this.fetchSubscriptionsAutomatically) {
        this.loadPostsFromCacheSometimes()
        return
      }
      if (this.$store.getters.getSubscriptionForCommunityPostsFirstAutoFetchRun) {
        // Only auto fetch once per window
        this.loadPostsFromCacheSometimes()
        return
      }

      this.alreadyLoadedRemotely = true
      this.loadPostsForSubscriptionsFromRemote()
      this.$store.commit('setSubscriptionForCommunityPostsFirstAutoFetchRun')
    },
    loadPostsFromCacheSometimes() {
      // Can only load reliably when cache ready
      if (!this.subscriptionCacheReady) { return }

      // This method is called on view visible
      if (this.postCacheForAllActiveProfileChannelsPresent) {
        this.loadPostsFromCacheForAllActiveProfileChannels()
        return
      }

      if (this.fetchSubscriptionsAutomatically) {
        // `this.isLoading = false` is called inside `loadPostsForSubscriptionsFromRemote` when needed
        this.loadPostsForSubscriptionsFromRemote()
        return
      }

      this.postList = []
      this.attemptedFetch = false
      this.isLoading = false
    },

    async loadPostsFromCacheForAllActiveProfileChannels() {
      const postList = this.cacheEntriesForAllActiveProfileChannels.flatMap((cacheEntry) => {
        return cacheEntry.posts
      })

      postList.sort((a, b) => {
        return b.publishedTime - a.publishedTime
      })

      this.postList = postList
      this.isLoading = false
    },

    loadPostsForSubscriptionsFromRemote: async function () {
      if (this.activeSubscriptionList.length === 0) {
        this.isLoading = false
        this.postList = []
        return
      }

      const channelsToLoadFromRemote = this.activeSubscriptionList
      let channelCount = 0
      this.isLoading = true

      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)
      this.attemptedFetch = true

      this.errorChannels = []
      const subscriptionUpdates = []

      const postListFromRemote = (await Promise.all(channelsToLoadFromRemote.map(async (channel) => {
        let posts = []
        if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious') {
          posts = await this.getChannelPostsInvidious(channel)
        } else {
          posts = await this.getChannelPostsLocal(channel)
        }

        channelCount++
        const percentageComplete = (channelCount / channelsToLoadFromRemote.length) * 100
        this.setProgressBarPercentage(percentageComplete)

        this.updateSubscriptionPostsCacheByChannel({
          channelId: channel.id,
          posts: posts
        })

        if (posts.length > 0) {
          const post = posts.find(post => post.authorId === channel.id)

          if (post) {
            const name = post.author
            let thumbnailUrl = post.authorThumbnails?.[0]?.url

            if (name || thumbnailUrl) {
              if (thumbnailUrl?.startsWith('//')) {
                thumbnailUrl = 'https:' + thumbnailUrl
              }

              subscriptionUpdates.push({
                channelId: channel.id,
                channelName: name,
                channelThumbnailUrl: thumbnailUrl
              })
            }
          }
        }

        return posts
      }))).flat()

      postListFromRemote.sort((a, b) => {
        return b.publishedTime - a.publishedTime
      })

      this.postList = postListFromRemote
      this.isLoading = false
      this.updateShowProgressBar(false)
      this.lastRemoteRefreshSuccessTimestamp = new Date()

      this.batchUpdateSubscriptionDetails(subscriptionUpdates)
    },

    getChannelPostsLocal: async function (channel) {
      try {
        const entries = await getLocalChannelCommunity(channel.id)

        if (entries === null) {
          this.errorChannels.push(channel)
          return []
        }

        return entries
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          return await this.getChannelPostsInvidious(channel)
        }
        return []
      }
    },

    getChannelPostsInvidious: function (channel) {
      return new Promise((resolve, reject) => {
        invidiousGetCommunityPosts(channel.id).then(result => {
          resolve(result.posts)
        }).catch((err) => {
          console.error(err)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          showToast(`${errorMessage}: ${err}`, 10000, () => {
            copyToClipboard(err)
          })
          if (process.env.SUPPORTS_LOCAL_API && this.backendPreference === 'invidious' && this.backendFallback) {
            showToast(this.$t('Falling back to Local API'))
            resolve(this.getChannelPostsLocal(channel))
          } else {
            resolve([])
          }
        })
      })
    },

    ...mapActions([
      'updateShowProgressBar',
      'batchUpdateSubscriptionDetails',
      'updateSubscriptionPostsCacheByChannel',
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
