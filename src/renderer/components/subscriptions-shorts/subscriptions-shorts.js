import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtChannelBubble from '../../components/ft-channel-bubble/ft-channel-bubble.vue'

import { calculatePublishedDate, copyToClipboard, showToast } from '../../helpers/utils'
import { invidiousAPICall } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'SubscriptionsShorts',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-icon-button': FtIconButton,
    'ft-flex-box': FtFlexBox,
    'ft-element-list': FtElementList,
    'ft-channel-bubble': FtChannelBubble
  },
  data: function () {
    return {
      isLoading: false,
      dataLimit: 100,
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

    hideWatchedSubs: function () {
      return this.$store.getters.getHideWatchedSubs
    },

    activeVideoList: function () {
      if (this.videoList.length < this.dataLimit) {
        return this.videoList
      } else {
        return this.videoList.slice(0, this.dataLimit)
      }
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

    historyCache: function () {
      return this.$store.getters.getHistoryCache
    },

    activeSubscriptionList: function () {
      return this.activeProfile.subscriptions
    },

    hideLiveStreams: function() {
      return this.$store.getters.getHideLiveStreams
    },

    hideUpcomingPremieres: function () {
      return this.$store.getters.getHideUpcomingPremieres
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
    document.addEventListener('keydown', this.keyboardShortcutHandler)

    this.isLoading = true
    const dataLimit = sessionStorage.getItem('subscriptionLimit')
    if (dataLimit !== null) {
      this.dataLimit = dataLimit
    }

    this.loadVideosFromCacheSometimes()
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
  },
  methods: {
    loadVideosFromCacheSometimes() {
      // This method is called on view visible
      if (this.videoCacheForAllActiveProfileChannelsPresent) {
        this.loadVideosFromCacheForAllActiveProfileChannels()
        return
      }

      this.maybeLoadVideosForSubscriptionsFromRemote()
    },

    async loadVideosFromCacheForAllActiveProfileChannels() {
      const videoList = []
      this.activeSubscriptionList.forEach((channel) => {
        const channelCacheEntry = this.$store.getters.getShortsCacheByChannel(channel.id)

        videoList.push(...channelCacheEntry.videos)
      })
      this.updateVideoListAfterProcessing(videoList)
      this.isLoading = false
    },

    goToChannel: function (id) {
      this.$router.push({ path: `/channel/${id}` })
    },

    loadVideosForSubscriptionsFromRemote: async function () {
      if (this.activeSubscriptionList.length === 0) {
        this.isLoading = false
        this.videoList = []
        return
      }

      const channelsToLoadFromRemote = this.activeSubscriptionList
      const videoList = []
      let channelCount = 0
      this.isLoading = true
      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)
      this.attemptedFetch = true

      this.errorChannels = []
      const videoListFromRemote = (await Promise.all(channelsToLoadFromRemote.map(async (channel) => {
        let videos = []
        if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
          videos = await this.getChannelShortsInvidious(channel)
        } else {
          videos = await this.getChannelShortsLocal(channel)
        }

        channelCount++
        const percentageComplete = (channelCount / channelsToLoadFromRemote.length) * 100
        this.setProgressBarPercentage(percentageComplete)
        this.updateSubscriptionShortsCacheByChannel({
          channelId: channel.id,
          videos: videos,
        })
        return videos
      }))).flatMap((o) => o)
      videoList.push(...videoListFromRemote)

      this.updateVideoListAfterProcessing(videoList)
      this.isLoading = false
      this.updateShowProgressBar(false)
    },

    updateVideoListAfterProcessing(videoList) {
      // Filtering and sorting based in preference
      videoList.sort((a, b) => {
        return b.publishedDate - a.publishedDate
      })
      if (this.hideLiveStreams) {
        videoList = videoList.filter(item => {
          return (!item.liveNow && !item.isUpcoming)
        })
      }
      if (this.hideUpcomingPremieres) {
        videoList = videoList.filter(item => {
          if (item.isRSS) {
            // viewCount is our only method of detecting premieres in RSS
            // data without sending an additional request.
            // If we ever get a better flag, use it here instead.
            return item.viewCount !== '0'
          }
          // Observed for premieres in Local API Subscriptions.
          return item.premiereDate == null
        })
      }

      this.videoList = videoList.filter((video) => {
        if (this.hideWatchedSubs) {
          const historyIndex = this.historyCache.findIndex((x) => {
            return x.videoId === video.videoId
          })

          return historyIndex === -1
        } else {
          return true
        }
      })
    },

    maybeLoadVideosForSubscriptionsFromRemote: async function () {
      if (this.fetchSubscriptionsAutomatically) {
        // `this.isLoading = false` is called inside `loadVideosForSubscriptionsFromRemote` when needed
        await this.loadVideosForSubscriptionsFromRemote()
      } else {
        this.videoList = []
        this.attemptedFetch = false
        this.isLoading = false
      }
    },

    getChannelShortsLocal: async function (channel, failedAttempts = 0) {
      const playlistId = channel.id.replace('UC', 'UUSH')
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`

      try {
        const response = await fetch(feedUrl)

        if (response.status === 404) {
          return []
        }

        return await this.parseYouTubeRSSFeed(await response.text(), channel.id)
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
              return []
            }
          default:
            return []
        }
      }
    },

    getChannelShortsInvidious: async function (channel, failedAttempts = 0) {
      const playlistId = channel.id.replace('UC', 'UUSH')
      const feedUrl = `${this.currentInvidiousInstance}/feed/playlist/${playlistId}`

      try {
        const response = await fetch(feedUrl)

        if (response.status === 500) {
          return []
        }

        return await this.parseYouTubeRSSFeed(await response.text(), channel.id)
      } catch (error) {
        console.error(error)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${error}`, 10000, () => {
          copyToClipboard(error)
        })
        switch (failedAttempts) {
          case 0:
            if (process.env.IS_ELECTRON && this.backendFallback) {
              showToast(this.$t('Falling back to the local API'))
              return this.getChannelShortsLocal(channel, failedAttempts + 1)
            } else {
              return []
            }
          default:
            return []
        }
      }
    },

    async parseYouTubeRSSFeed(rssString, channelId) {
      try {
        const xmlDom = new DOMParser().parseFromString(rssString, 'application/xml')
        const channelName = xmlDom.querySelector('author > name').textContent
        const entries = xmlDom.querySelectorAll('entry')

        const promises = []

        for (const entry of entries) {
          promises.push(this.parseRSSEntry(entry, channelId, channelName))
        }

        return await Promise.all(promises)
      } catch (e) {
        return []
      }
    },

    async parseRSSEntry(entry, channelId, channelName) {
      const published = new Date(entry.querySelector('published').textContent)
      return {
        authorId: channelId,
        author: channelName,
        // querySelector doesn't support xml namespaces so we have to use getElementsByTagName here
        videoId: entry.getElementsByTagName('yt:videoId')[0].textContent,
        title: entry.querySelector('title').textContent,
        publishedDate: published,
        publishedText: published.toLocaleString(),
        viewCount: entry.getElementsByTagName('media:statistics')[0]?.getAttribute('views') || null,
        type: 'video',
        lengthSeconds: '0:00',
        isRSS: true
      }
    },

    increaseLimit: function () {
      this.dataLimit += 100
      sessionStorage.setItem('subscriptionLimit', this.dataLimit)
    },

    /**
     * This function `keyboardShortcutHandler` should always be at the bottom of this file
     * @param {KeyboardEvent} event the keyboard event
     */
    keyboardShortcutHandler: function (event) {
      if (event.ctrlKey || document.activeElement.classList.contains('ft-input')) {
        return
      }
      // Avoid handling events due to user holding a key (not released)
      // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
      if (event.repeat) { return }

      switch (event.key) {
        case 'r':
        case 'R':
          if (!this.isLoading) {
            this.loadVideosForSubscriptionsFromRemote()
          }
          break
      }
    },

    ...mapActions([
      'updateShowProgressBar',
      'updateSubscriptionShortsCacheByChannel',
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
