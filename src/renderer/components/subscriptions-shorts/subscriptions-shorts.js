import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import SubscriptionsTabUI from '../SubscriptionsTabUi/SubscriptionsTabUi.vue'

import { parseYouTubeRSSFeed, updateVideoListAfterProcessing } from '../../helpers/subscriptions'
import {
  copyToClipboard,
  getChannelPlaylistId,
  getRelativeTimeFromDate,
  showToast
} from '../../helpers/utils'
import { invidiousFetch } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'SubscriptionsShorts',
  components: {
    'subscriptions-tab-ui': SubscriptionsTabUI
  },
  data: function () {
    return {
      isLoading: true,
      alreadyLoadedRemotely: false,
      videoList: [],
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

    subscriptionCacheReady: function () {
      return this.$store.getters.getSubscriptionCacheReady
    },

    lastShortRefreshTimestamp: function () {
      // Cache is not ready when data is just loaded from remote
      if (this.lastRemoteRefreshSuccessTimestamp) {
        return getRelativeTimeFromDate(this.lastRemoteRefreshSuccessTimestamp, true)
      }
      if (!this.videoCacheForAllActiveProfileChannelsPresent) { return '' }
      if (this.cacheEntriesForAllActiveProfileChannels.length === 0) { return '' }

      let minTimestamp = null
      this.cacheEntriesForAllActiveProfileChannels.forEach((cacheEntry) => {
        if (!minTimestamp || cacheEntry.timestamp.getTime() < minTimestamp.getTime()) {
          minTimestamp = cacheEntry.timestamp
        }
      })
      return getRelativeTimeFromDate(minTimestamp, true)
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
        const cacheEntry = this.$store.getters.getShortsCacheByChannel(channel.id)
        if (cacheEntry == null) { return }

        entries.push(cacheEntry)
      })
      return entries
    },
    videoCacheForAllActiveProfileChannelsPresent() {
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
      this.lastRemoteRefreshSuccessTimestamp = null
      this.isLoading = true
      this.loadVideosFromCacheSometimes()
    },

    subscriptionCacheReady() {
      if (!this.alreadyLoadedRemotely) {
        this.loadVideosFromCacheSometimes()
      }
    },
  },
  mounted: async function () {
    this.loadVideosFromRemoteFirstPerWindowSometimes()
  },
  methods: {
    loadVideosFromRemoteFirstPerWindowSometimes() {
      if (!this.fetchSubscriptionsAutomatically) {
        this.loadVideosFromCacheSometimes()
        return
      }
      if (this.$store.getters.getSubscriptionForShortsFirstAutoFetchRun) {
        // Only auto fetch once per window
        this.loadVideosFromCacheSometimes()
        return
      }

      this.alreadyLoadedRemotely = true
      this.loadVideosForSubscriptionsFromRemote()
      this.$store.commit('setSubscriptionForShortsFirstAutoFetchRun')
    },
    loadVideosFromCacheSometimes() {
      // Can only load reliably when cache ready
      if (!this.subscriptionCacheReady) { return }

      // This method is called on view visible
      if (this.videoCacheForAllActiveProfileChannelsPresent) {
        this.loadVideosFromCacheForAllActiveProfileChannels()
        return
      }

      if (this.fetchSubscriptionsAutomatically) {
        // `this.isLoading = false` is called inside `loadVideosForSubscriptionsFromRemote` when needed
        this.loadVideosForSubscriptionsFromRemote()
        return
      }

      // Auto fetch disabled, not enough cache for profile = show nothing
      this.videoList = []
      this.attemptedFetch = false
      this.isLoading = false
    },

    async loadVideosFromCacheForAllActiveProfileChannels() {
      const videoList = this.cacheEntriesForAllActiveProfileChannels.flatMap((cacheEntry) => {
        return cacheEntry.videos
      })

      this.videoList = updateVideoListAfterProcessing(videoList)
      this.isLoading = false
    },

    loadVideosForSubscriptionsFromRemote: async function () {
      if (this.activeSubscriptionList.length === 0) {
        this.isLoading = false
        this.videoList = []
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

      const videoListFromRemote = (await Promise.all(channelsToLoadFromRemote.map(async (channel) => {
        let videos = []
        let name

        if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious') {
          ({ videos, name } = await this.getChannelShortsInvidious(channel))
        } else {
          ({ videos, name } = await this.getChannelShortsLocal(channel))
        }

        channelCount++
        const percentageComplete = (channelCount / channelsToLoadFromRemote.length) * 100
        this.setProgressBarPercentage(percentageComplete)

        if (videos != null) {
          this.updateSubscriptionShortsCacheByChannel({
            channelId: channel.id,
            videos: videos
          })
        }

        if (name) {
          subscriptionUpdates.push({
            channelId: channel.id,
            channelName: name
          })
        }

        return videos ?? []
      }))).flat()

      this.videoList = updateVideoListAfterProcessing(videoListFromRemote)
      this.isLoading = false
      this.updateShowProgressBar(false)
      this.lastRemoteRefreshSuccessTimestamp = new Date()

      this.batchUpdateSubscriptionDetails(subscriptionUpdates)
    },

    getChannelShortsLocal: async function (channel, failedAttempts = 0) {
      const playlistId = getChannelPlaylistId(channel.id, 'shorts', 'newest')
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`

      try {
        const response = await fetch(feedUrl)

        if (response.status === 403) {
          return {
            videos: null
          }
        }

        if (response.status === 404) {
          // playlists don't exist if the channel was terminated but also if it doesn't have the tab,
          // so we need to check the channel feed too before deciding it errored, as that only 404s if the channel was terminated

          const response2 = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`, {
            method: 'HEAD'
          })

          if (response2.status === 404) {
            this.errorChannels.push(channel)
          }

          return {
            videos: []
          }
        }

        return await parseYouTubeRSSFeed(await response.text(), channel.id)
      } catch (error) {
        console.error(error)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${error}`, 10000, () => {
          copyToClipboard(error)
        })
        switch (failedAttempts) {
          case 0:
            if (this.backendFallback) {
              showToast(this.$t('Falling back to Invidious API'))
              return this.getChannelShortsInvidious(channel, failedAttempts + 1)
            } else {
              return {
                videos: []
              }
            }
          default:
            return {
              videos: []
            }
        }
      }
    },

    getChannelShortsInvidious: async function (channel, failedAttempts = 0) {
      const playlistId = getChannelPlaylistId(channel.id, 'shorts', 'newest')
      const feedUrl = `${this.currentInvidiousInstanceUrl}/feed/playlist/${playlistId}`

      try {
        const response = await invidiousFetch(feedUrl)

        if (response.status === 500 || response.status === 404) {
          return {
            videos: []
          }
        }

        return await parseYouTubeRSSFeed(await response.text(), channel.id)
      } catch (error) {
        console.error(error)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${error}`, 10000, () => {
          copyToClipboard(error)
        })
        switch (failedAttempts) {
          case 0:
            if (process.env.SUPPORTS_LOCAL_API && this.backendFallback) {
              showToast(this.$t('Falling back to Local API'))
              return this.getChannelShortsLocal(channel, failedAttempts + 1)
            } else {
              return {
                videos: []
              }
            }
          default:
            return {
              videos: []
            }
        }
      }
    },

    ...mapActions([
      'batchUpdateSubscriptionDetails',
      'updateShowProgressBar',
      'updateSubscriptionShortsCacheByChannel',
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
