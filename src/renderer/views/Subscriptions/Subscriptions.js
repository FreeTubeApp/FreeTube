import Vue from 'vue'
import { mapActions, mapMutations } from 'vuex'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

import ytch from 'yt-channel-info'
import Parser from 'rss-parser'

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
    activeProfile: async function (val) {
      if (this.allSubscriptionsList.length !== 0) {
        this.isLoading = true
        this.videoList = await Promise.all(this.allSubscriptionsList.filter((video) => {
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
        }))
        this.isLoading = false
      } else {
        this.getSubscriptions()
      }
    }
  },
  mounted: async function () {
    this.isLoading = true
    const dataLimit = sessionStorage.getItem('subscriptionLimit')
    if (dataLimit !== null) {
      this.dataLimit = dataLimit
    }
    setTimeout(async () => {
      if (this.profileSubscriptions.videoList.length === 0) {
        this.getSubscriptions()
      } else {
        const subscriptionList = JSON.parse(JSON.stringify(this.profileSubscriptions))
        if (this.hideWatchedSubs) {
          this.videoList = await Promise.all(subscriptionList.videoList.filter((video) => {
            const historyIndex = this.historyCache.findIndex((x) => {
              return x.videoId === video.videoId
            })

            return historyIndex === -1
          }))
        } else {
          this.videoList = subscriptionList.videoList
        }
        this.isLoading = false
      }
    }, 200)
  },
  methods: {
    getSubscriptions: function () {
      if (this.activeSubscriptionList.length === 0) {
        this.isLoading = false
        this.videoList = []
        return
      }
      this.isLoading = true
      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)

      let videoList = []
      let channelCount = 0

      this.activeSubscriptionList.forEach(async (channel) => {
        let videos = []

        if (!this.usingElectron || this.backendPreference === 'invidious') {
          if (this.useRssFeeds) {
            videos = await this.getChannelVideosInvidiousRSS(channel.id)
          } else {
            videos = await this.getChannelVideosInvidiousScraper(channel.id)
          }
        } else {
          if (this.useRssFeeds) {
            videos = await this.getChannelVideosLocalRSS(channel.id)
          } else {
            videos = await this.getChannelVideosLocalScraper(channel.id)
          }
        }

        videoList = videoList.concat(videos)
        channelCount++
        const percentageComplete = (channelCount / this.activeSubscriptionList.length) * 100
        this.setProgressBarPercentage(percentageComplete)

        if (channelCount === this.activeSubscriptionList.length) {
          videoList = await Promise.all(videoList.sort((a, b) => {
            return b.publishedDate - a.publishedDate
          }))

          const profileSubscriptions = {
            activeProfile: this.activeProfile,
            videoList: videoList
          }

          this.videoList = await Promise.all(videoList.filter((video) => {
            if (this.hideWatchedSubs) {
              const historyIndex = this.historyCache.findIndex((x) => {
                return x.videoId === video.videoId
              })

              return historyIndex === -1
            } else {
              return true
            }
          }))
          this.updateProfileSubscriptions(profileSubscriptions)
          this.isLoading = false
          this.updateShowProgressBar(false)

          if (this.activeProfile === 0) {
            this.updateAllSubscriptionsList(profileSubscriptions.videoList)
          }
        }
      })
    },

    getChannelVideosLocalScraper: function (channelId) {
      return new Promise((resolve, reject) => {
        ytch.getChannelVideos(channelId, 'latest').then(async (response) => {
          const videos = await Promise.all(response.items.map(async (video) => {
            video.publishedDate = await this.calculatePublishedDate(video.publishedText)
            return video
          }))

          resolve(videos)
        }).catch((err) => {
          console.log(err)
          const errorMessage = this.$t('Local API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(err)
            }
          })
          resolve([])
        })
      })
    },

    getChannelVideosLocalRSS: function (channelId) {
      return new Promise((resolve, reject) => {
        const parser = new Parser()
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

        parser.parseURL(feedUrl).then(async (feed) => {
          resolve(await Promise.all(feed.items.map((video) => {
            video.authorId = channelId
            video.videoId = video.id.replace('yt:video:', '')
            video.type = 'video'
            video.publishedDate = new Date(video.pubDate)
            video.publishedText = video.publishedDate.toLocaleString()
            video.lengthSeconds = '0:00'
            video.isRSS = true

            return video
          })))
        }).catch((err) => {
          console.log(err)
          resolve([])
        })
      })
    },

    getChannelVideosInvidiousScraper: function (channelId) {
      return new Promise((resolve, reject) => {
        const subscriptionsPayload = {
          resource: 'channels/latest',
          id: channelId,
          params: {}
        }

        this.invidiousAPICall(subscriptionsPayload).then((result) => {
          resolve(result)
        })
      })
    },

    getChannelVideosInvidiousRSS: function (channelId) {
      return new Promise((resolve, reject) => {
        const parser = new Parser()
        const feedUrl = `${this.invidiousInstance}/feed/channel/${channelId}`

        parser.parseURL(feedUrl).then(async (feed) => {
          resolve(await Promise.all(feed.items.map((video) => {
            video.authorId = channelId
            video.videoId = video.id.replace('yt:video:', '')
            video.type = 'video'
            video.publishedDate = new Date(video.pubDate)
            video.publishedText = video.publishedDate.toLocaleString()
            video.lengthSeconds = '0:00'
            video.isRSS = true

            return video
          })))
        })
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
      'updateAllSubscriptionsList',
      'calculatePublishedDate'
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
