import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import SubscriptionsTabUI from '../subscriptions-tab-ui/subscriptions-tab-ui.vue'

import { calculatePublishedDate, copyToClipboard, getRelativeTimeFromDate, showToast } from '../../helpers/utils'
import { getLocalChannelCommunity } from '../../helpers/api/local'
import { invidiousGetCommunityPosts } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'SubscriptionsCommunity',
  components: {
    'subscriptions-tab-ui': SubscriptionsTabUI
  },
  data: function () {
    return {
      isLoading: false,
      postList: [],
      errorChannels: [],
      attemptedFetch: false,
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
      return getRelativeTimeFromDate(this.$store.getters.getLastCommunityRefreshTimestampByProfile(this.activeProfileId), true)
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
      this.isLoading = true
      this.loadPostsFromCacheSometimes()
    },
  },
  mounted: async function () {
    this.isLoading = true

    this.loadPostsFromCacheSometimes()
  },
  methods: {
    loadPostsFromCacheSometimes() {
      // This method is called on view visible
      if (this.postCacheForAllActiveProfileChannelsPresent) {
        this.loadPostsFromCacheForAllActiveProfileChannels()
        if (this.cacheEntriesForAllActiveProfileChannels.length > 0) {
          let minTimestamp = null
          this.cacheEntriesForAllActiveProfileChannels.forEach((cacheEntry) => {
            if (!minTimestamp || cacheEntry.timestamp.getTime() < minTimestamp.getTime()) {
              minTimestamp = cacheEntry.timestamp
            }
          })
          this.updateLastCommunityRefreshTimestampByProfile({ profileId: this.activeProfileId, timestamp: minTimestamp })
        }
        return
      }

      // clear timestamp if not all entries are present in the cache
      this.updateLastCommunityRefreshTimestampByProfile({ profileId: this.activeProfileId, timestamp: '' })
      this.maybeLoadPostsForSubscriptionsFromRemote()
    },

    async loadPostsFromCacheForAllActiveProfileChannels() {
      const postList = []
      this.activeSubscriptionList.forEach((channel) => {
        const channelCacheEntry = this.$store.getters.getPostsCacheByChannel(channel.id)

        postList.push(...channelCacheEntry.posts)
      })

      postList.sort((a, b) => {
        return calculatePublishedDate(b.publishedText) - calculatePublishedDate(a.publishedText)
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
      const postList = []
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
              if (thumbnailUrl) {
                if (thumbnailUrl.startsWith('//')) {
                  thumbnailUrl = 'https:' + thumbnailUrl
                } else if (thumbnailUrl.startsWith(`${this.currentInvidiousInstanceUrl}/ggpht`)) {
                  thumbnailUrl = thumbnailUrl.replace(`${this.currentInvidiousInstanceUrl}/ggpht`, 'https://yt3.googleusercontent.com')
                }
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
      }))).flatMap((o) => o)
      postList.push(...postListFromRemote)
      this.updateLastCommunityRefreshTimestampByProfile({ profileId: this.activeProfileId, timestamp: new Date() })
      postList.sort((a, b) => {
        return calculatePublishedDate(b.publishedText) - calculatePublishedDate(a.publishedText)
      })

      this.postList = postList
      this.isLoading = false
      this.updateShowProgressBar(false)

      this.batchUpdateSubscriptionDetails(subscriptionUpdates)
    },

    maybeLoadPostsForSubscriptionsFromRemote: async function () {
      if (this.fetchSubscriptionsAutomatically) {
        // `this.isLoading = false` is called inside `loadPostsForSubscriptionsFromRemote` when needed
        await this.loadPostsForSubscriptionsFromRemote()
      } else {
        this.postList = []
        this.attemptedFetch = false
        this.isLoading = false
      }
    },

    getChannelPostsLocal: async function (channel) {
      try {
        const entries = await getLocalChannelCommunity(channel.id)

        if (entries === null) {
          this.errorChannels.push(channel)
          return []
        }
        entries.forEach(post => {
          post.authorId = channel.id
        })
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
          result.posts.forEach(post => {
            post.authorId = channel.id
          })
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
      'updateLastCommunityRefreshTimestampByProfile'
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
