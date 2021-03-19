import Vue from 'vue'
import { mapActions, mapMutations } from 'vuex'
import ytch from 'yt-channel-info'
import Parser from 'rss-parser'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import { calculatePublishedDate } from '../../helpers'

export default Vue.extend({
  name: 'Subscriptions',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-icon-button': FtIconButton,
    'ft-flex-box': FtFlexBox,
    'ft-element-list': FtElementList
  },
  data: function () {
    return {
      isLoading: false,
      dataLimit: 100,
      videoList: []
    }
  },
  computed: {
    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },

    hideWatchedSubs: function () {
      return this.$store.getters.getHideWatchedSubs
    },

    useRssFeeds: function () {
      return this.$store.getters.getUseRssFeeds
    },

    profileList: function () {
      return this.$store.getters.getProfileList
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

    profileSubscriptions: function () {
      return this.$store.getters.getProfileSubscriptions
    },

    allSubscriptionsList: function () {
      return this.$store.getters.getAllSubscriptionsList
    },

    historyCache: function () {
      return this.$store.getters.getHistoryCache
    },

    activeSubscriptionList: function () {
      return this.profileList[this.activeProfile].subscriptions
    }
  },
  watch: {
    activeProfile: function (val) {
      this.getProfileSubscriptions()
    }
  },
  mounted: function () {
    this.isLoading = true
    const dataLimit = sessionStorage.getItem('subscriptionLimit')
    if (dataLimit !== null) {
      this.dataLimit = dataLimit
    }

    if (this.profileSubscriptions.videoList.length !== 0) {
      if (this.profileSubscriptions.activeProfile === this.activeProfile) {
        const subscriptionList = this.profileSubscriptions
        if (this.hideWatchedSubs) {
          this.videoList = subscriptionList.videoList.filter((video) => {
            const historyIndex = this.historyCache.findIndex((x) => {
              return x.videoId === video.videoId
            })

            return historyIndex === -1
          })
        } else {
          this.videoList = subscriptionList.videoList
        }
      } else {
        this.getProfileSubscriptions()
      }

      this.isLoading = false
    } else {
      setTimeout(() => {
        this.getSubscriptions()
      }, 1000 * 10) // every 10 seconds
    }
  },
  methods: {
    getSubscriptions: function () {
      if (this.activeSubscriptionList.length === 0) {
        this.isLoading = false
        this.videoList = []
        return
      }

      let useRss = this.useRssFeeds
      if (this.activeSubscriptionList.length >= 125 && !useRss) {
        this.showToast({
          message: this.$t('Subscriptions["This profile has a large number of subscriptions.  Forcing RSS to avoid rate limiting"]'),
          time: 10000
        })
        useRss = true
      }
      this.isLoading = true
      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)

      let channelCount = 0

      Promise.all(this.activeSubscriptionList.map(channel => Promise.resolve().then(() => {
        if (!this.usingElectron || this.backendPreference === 'invidious') {
          return useRss
            ? this.getChannelVideosInvidiousRSS(channel)
            : this.getChannelVideosInvidiousScraper(channel)
        }
        return useRss
          ? this.getChannelVideosLocalRSS(channel)
          : this.getChannelVideosLocalScraper(channel)
      })
        .then(videos => {
          channelCount++
          const percentageComplete = (channelCount / this.activeSubscriptionList.length) * 100
          this.setProgressBarPercentage(percentageComplete)
          return videos
        })
      )).then(videos => {
        const videoList = videos.flat().sort((a, b) => {
          return b.publishedDate - a.publishedDate
        })

        const profileSubscriptions = {
          activeProfile: this.activeProfile,
          videoList
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
        this.updateProfileSubscriptions(profileSubscriptions)
        this.isLoading = false
        this.updateShowProgressBar(false)

        if (this.activeProfile === 0) {
          this.updateAllSubscriptionsList(profileSubscriptions.videoList)
        }
      })
    },

    getProfileSubscriptions: function () {
      if (this.allSubscriptionsList.length !== 0) {
        this.videoList = this.allSubscriptionsList.filter((video) => {
          const channelIndex = this.activeSubscriptionList.findIndex((x) => {
            return x.id === video.authorId
          })

          const historyIndex = this.historyCache.findIndex((x) => {
            return x.videoId === video.videoId
          })

          if (this.hideWatchedSubs) {
            return channelIndex !== -1 && historyIndex === -1
          } else {
            return channelIndex !== -1
          }
        })
      } else {
        this.getSubscriptions()
      }
    },

    getChannelVideosLocalScraper: function (channel, failedAttempts = 0) {
      return ytch.getChannelVideos(channel.id, 'latest')
        .then(response => response.items.map(video => {
          if (video.liveNow) {
            video.publishedDate = new Date().getTime()
          } else {
            video.publishedDate = calculatePublishedDate(video.publishedText)
          }
          return video
        }))
        .catch(error => {
          console.log(error)
          const errorMessage = this.$t('Local API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${error}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(error)
            }
          })
          switch (failedAttempts) {
            case 0:
              return this.getChannelVideosLocalRSS(channel, failedAttempts + 1)
            case 1:
              if (this.backendFallback) {
                this.showToast({
                  message: this.$t('Falling back to Invidious API')
                })
                return this.getChannelVideosInvidiousScraper(channel, failedAttempts + 1)
              }
              return Promise.resolve([])
            case 2:
              return this.getChannelVideosLocalRSS(channel, failedAttempts + 1)
            default:
              return Promise.resolve([])
          }
        })
    },

    getChannelVideosLocalRSS: function (channel, failedAttempts = 0) {
      const parser = new Parser()
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`

      return parser.parseURL(feedUrl)
        .then(feed => feed.items.map(video => {
          video.authorId = channel.id
          video.videoId = video.id.replace('yt:video:', '')
          video.type = 'video'
          video.lengthSeconds = '0:00'
          video.isRSS = true

          video.publishedDate = new Date(video.pubDate)

          if (video.publishedDate.toString() === 'Invalid Date') {
            video.publishedDate = new Date(video.isoDate)
          }

          video.publishedText = video.publishedDate.toLocaleString()

          return video
        }))
        .catch(error => {
          console.log(error)
          const errorMessage = this.$t('Local API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${error}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(error)
            }
          })
          switch (failedAttempts) {
            case 0:
              return this.getChannelVideosLocalScraper(channel, failedAttempts + 1)
            case 1:
              if (this.backendFallback) {
                this.showToast({
                  message: this.$t('Falling back to Invidious API')
                })
                return this.getChannelVideosInvidiousRSS(channel, failedAttempts + 1)
              }
              return Promise.resolve([])
            case 2:
              return this.getChannelVideosLocalScraper(channel, failedAttempts + 1)
            default:
              return Promise.resolve([])
          }
        })
    },

    getChannelVideosInvidiousScraper: function (channel, failedAttempts = 0) {
      const subscriptionsPayload = {
        resource: 'channels/latest',
        id: channel.id,
        params: {}
      }

      return this.invidiousAPICall(subscriptionsPayload)
        .then(result => result.map((video) => {
          video.publishedDate = new Date(video.published * 1000)
          return video
        })).catch(error => {
          console.log(error)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${error}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(error)
            }
          })
          switch (failedAttempts) {
            case 0:
              return this.getChannelVideosInvidiousRSS(channel, failedAttempts + 1)
            case 1:
              if (this.backendFallback) {
                this.showToast({
                  message: this.$t('Falling back to the local API')
                })
                return this.getChannelVideosLocalScraper(channel, failedAttempts + 1)
              }
              return Promise.resolve([])
            case 2:
              return this.getChannelVideosInvidiousRSS(channel, failedAttempts + 1)
            default:
              return Promise.resolve([])
          }
        })
    },

    getChannelVideosInvidiousRSS: function (channel, failedAttempts = 0) {
      const parser = new Parser()
      const feedUrl = `${this.invidiousInstance}/feed/channel/${channel.id}`

      return parser.parseURL(feedUrl)
        .then(feed => feed.items.map((video) => {
          video.authorId = channel.id
          video.videoId = video.id.replace('yt:video:', '')
          video.type = 'video'
          video.publishedDate = new Date(video.pubDate)
          video.publishedText = video.publishedDate.toLocaleString()
          video.lengthSeconds = '0:00'
          video.isRSS = true

          return video
        })
        ).catch(error => {
          console.log(error)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${error}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(error)
            }
          })

          switch (failedAttempts) {
            case 0:
              return this.getChannelVideosInvidiousScraper(channel, failedAttempts + 1)
            case 1:
              if (this.backendFallback) {
                this.showToast({
                  message: this.$t('Falling back to the local API')
                })
                return this.getChannelVideosLocalRSS(channel, failedAttempts + 1)
              }
              return Promise.resolve([])
            case 2:
              return this.getChannelVideosInvidiousScraper(channel, failedAttempts + 1)
            default:
              return Promise.resolve([])
          }
        })
    },

    increaseLimit: function () {
      this.dataLimit += 100
      sessionStorage.setItem('subscriptionLimit', this.dataLimit)
    },

    ...mapActions([
      'showToast',
      'invidiousAPICall',
      'updateShowProgressBar',
      'updateProfileSubscriptions',
      'updateAllSubscriptionsList'
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
