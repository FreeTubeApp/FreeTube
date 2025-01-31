import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import SubscriptionsTabUI from '../SubscriptionsTabUi/SubscriptionsTabUi.vue'

import {
  getChannelPlaylistId,
  copyToClipboard,
  getRelativeTimeFromDate,
  showToast
} from '../../helpers/utils'
import { getInvidiousChannelLive, invidiousFetch } from '../../helpers/api/invidious'
import { getLocalChannelLiveStreams } from '../../helpers/api/local'
import { parseYouTubeRSSFeed, updateVideoListAfterProcessing } from '../../helpers/subscriptions'

export default defineComponent({
  name: 'SubscriptionsLive',
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

    useRssFeeds: function () {
      return this.$store.getters.getUseRssFeeds
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
        const cacheEntry = this.$store.getters.getLiveCacheByChannel(channel.id)
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

    lastLiveRefreshTimestamp: function () {
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
      if (this.$store.getters.getSubscriptionForLiveStreamsFirstAutoFetchRun) {
        // Only auto fetch once per window
        this.loadVideosFromCacheSometimes()
        return
      }

      this.alreadyLoadedRemotely = true
      this.loadVideosForSubscriptionsFromRemote()
      this.$store.commit('setSubscriptionForLiveStreamsFirstAutoFetchRun')
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
      const subscriptionUpdates = []

      const videoListFromRemote = (await Promise.all(channelsToLoadFromRemote.map(async (channel) => {
        let videos = []
        let name, thumbnailUrl

        if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious') {
          if (useRss) {
            ({ videos, name, thumbnailUrl } = await this.getChannelLiveInvidiousRSS(channel))
          } else {
            ({ videos, name, thumbnailUrl } = await this.getChannelLiveInvidious(channel))
          }
        } else {
          if (useRss) {
            ({ videos, name, thumbnailUrl } = await this.getChannelLiveLocalRSS(channel))
          } else {
            ({ videos, name, thumbnailUrl } = await this.getChannelLiveLocal(channel))
          }
        }

        channelCount++
        const percentageComplete = (channelCount / channelsToLoadFromRemote.length) * 100
        this.setProgressBarPercentage(percentageComplete)

        if (videos != null) {
          this.updateSubscriptionLiveCacheByChannel({
            channelId: channel.id,
            videos: videos
          })
        }

        if (name || thumbnailUrl) {
          subscriptionUpdates.push({
            channelId: channel.id,
            channelName: name,
            channelThumbnailUrl: thumbnailUrl
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

    getChannelLiveLocal: async function (channel, failedAttempts = 0) {
      try {
        const result = await getLocalChannelLiveStreams(channel.id)

        if (result === null) {
          this.errorChannels.push(channel)
          return {
            videos: []
          }
        }

        return result
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        switch (failedAttempts) {
          case 0:
            return await this.getChannelLiveLocalRSS(channel, failedAttempts + 1)
          case 1:
            if (this.backendFallback) {
              showToast(this.$t('Falling back to Invidious API'))
              return await this.getChannelLiveInvidious(channel, failedAttempts + 1)
            } else {
              return {
                videos: []
              }
            }
          case 2:
            return await this.getChannelLiveLocalRSS(channel, failedAttempts + 1)
          default:
            return {
              videos: []
            }
        }
      }
    },

    getChannelLiveLocalRSS: async function (channel, failedAttempts = 0) {
      const playlistId = getChannelPlaylistId(channel.id, 'live', 'newest')
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
            return this.getChannelLiveLocal(channel, failedAttempts + 1)
          case 1:
            if (this.backendFallback) {
              showToast(this.$t('Falling back to Invidious API'))
              return this.getChannelLiveInvidiousRSS(channel, failedAttempts + 1)
            } else {
              return {
                videos: []
              }
            }
          case 2:
            return this.getChannelLiveLocal(channel, failedAttempts + 1)
          default:
            return {
              videos: []
            }
        }
      }
    },

    getChannelLiveInvidious: function (channel, failedAttempts = 0) {
      return new Promise((resolve, reject) => {
        getInvidiousChannelLive(channel.id).then((result) => {
          const videos = result.videos

          let name

          if (videos.length > 0) {
            name = videos.find(video => video.author).author
          }

          resolve({
            name,
            videos
          })
        }).catch((err) => {
          console.error(err)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          showToast(`${errorMessage}: ${err}`, 10000, () => {
            copyToClipboard(err)
          })
          switch (failedAttempts) {
            case 0:
              resolve(this.getChannelLiveInvidiousRSS(channel, failedAttempts + 1))
              break
            case 1:
              if (process.env.SUPPORTS_LOCAL_API && this.backendFallback) {
                showToast(this.$t('Falling back to Local API'))
                resolve(this.getChannelLiveLocal(channel, failedAttempts + 1))
              } else {
                resolve({
                  videos: []
                })
              }
              break
            case 2:
              resolve(this.getChannelLiveInvidiousRSS(channel, failedAttempts + 1))
              break
            default:
              resolve({
                videos: []
              })
          }
        })
      })
    },

    getChannelLiveInvidiousRSS: async function (channel, failedAttempts = 0) {
      const playlistId = getChannelPlaylistId(channel.id, 'live', 'newest')
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
            return this.getChannelLiveInvidious(channel, failedAttempts + 1)
          case 1:
            if (process.env.SUPPORTS_LOCAL_API && this.backendFallback) {
              showToast(this.$t('Falling back to Local API'))
              return this.getChannelLiveLocalRSS(channel, failedAttempts + 1)
            } else {
              return {
                videos: []
              }
            }
          case 2:
            return this.getChannelLiveInvidious(channel, failedAttempts + 1)
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
      'updateSubscriptionLiveCacheByChannel',
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
