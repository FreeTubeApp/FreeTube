import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import SubscriptionsTabUI from '../subscriptions-tab-ui/subscriptions-tab-ui.vue'

import { calculatePublishedDate, copyToClipboard, showToast } from '../../helpers/utils'
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
      videoList: [],
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

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    useRssFeeds: function () {
      return this.$store.getters.getUseRssFeeds
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
    postCacheForAllActiveProfileChannelsPresent() {
      if (this.cacheEntriesForAllActiveProfileChannels.length === 0) { return false }
      if (this.cacheEntriesForAllActiveProfileChannels.length < this.activeSubscriptionList.length) { return false }

      return this.cacheEntriesForAllActiveProfileChannels.every((cacheEntry) => {
        return cacheEntry.videos != null
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
      this.loadVideosFromCacheSometimes()
    },
  },
  mounted: async function () {
    this.isLoading = true

    this.loadVideosFromCacheSometimes()
  },
  methods: {
    loadVideosFromCacheSometimes() {
      // This method is called on view visible
      if (this.postCacheForAllActiveProfileChannelsPresent) {
        this.loadPostsFromCacheForAllActiveProfileChannels()
        return
      }

      this.maybeLoadPostsForSubscriptionsFromRemote()
    },

    async loadPostsFromCacheForAllActiveProfileChannels() {
      const videoList = []
      this.activeSubscriptionList.forEach((channel) => {
        const channelCacheEntry = this.$store.getters.getPostsCacheByChannel(channel.id)

        videoList.push(...channelCacheEntry.videos)
      })

      videoList.sort((a, b) => {
        return calculatePublishedDate(b.publishedText) - calculatePublishedDate(a.publishedText)
      })

      this.videoList = videoList
      this.isLoading = false
    },

    loadPostsForSubscriptionsFromRemote: async function () {
      if (this.activeSubscriptionList.length === 0) {
        this.isLoading = false
        this.videoList = []
        return
      }

      const channelsToLoadFromRemote = this.activeSubscriptionList
      const videoList = []
      let channelCount = 0
      this.isLoading = true

      let useRss = this.useRssFeeds
      if (channelsToLoadFromRemote.length >= 125 && !useRss) {
        showToast(
          this.$t('Subscriptions["This profile has a large number of subscriptions. Forcing RSS to avoid rate limiting"]'),
          10000
        )
        useRss = true
      }
      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)
      this.attemptedFetch = true

      this.errorChannels = []
      const videoListFromRemote = (await Promise.all(channelsToLoadFromRemote.map(async (channel) => {
        let videos = []
        if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
          videos = await this.getChannelPostsInvidious(channel)
        } else {
          videos = await this.getChannelPostsLocal(channel)
        }

        channelCount++
        const percentageComplete = (channelCount / channelsToLoadFromRemote.length) * 100
        this.setProgressBarPercentage(percentageComplete)

        this.updateSubscriptionPostsCacheByChannel({
          channelId: channel.id,
          videos: videos,
        })
        return videos
      }))).flatMap((o) => o)
      videoList.push(...videoListFromRemote)
      videoList.sort((a, b) => {
        return calculatePublishedDate(b.publishedText) - calculatePublishedDate(a.publishedText)
      })

      this.videoList = videoList
      this.isLoading = false
      this.updateShowProgressBar(false)
    },

    maybeLoadPostsForSubscriptionsFromRemote: async function () {
      if (this.fetchSubscriptionsAutomatically) {
        // `this.isLoading = false` is called inside `loadPostsForSubscriptionsFromRemote` when needed
        await this.loadPostsForSubscriptionsFromRemote()
      } else {
        this.videoList = []
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
          showToast(`${errorMessage}: ${err.responseText}`, 10000, () => {
            copyToClipboard(err.responseText)
          })
          if (process.env.IS_ELECTRON && this.backendPreference === 'invidious' && this.backendFallback) {
            showToast(this.$t('Falling back to the local API'))
            resolve(this.getChannelPostsLocal(channel))
          } else {
            resolve([])
          }
        })
      })
    },

    ...mapActions([
      'updateShowProgressBar',
      'updateSubscriptionPostsCacheByChannel',
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
