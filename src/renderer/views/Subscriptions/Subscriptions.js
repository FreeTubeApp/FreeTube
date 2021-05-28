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
      this.getProfileSubscriptions()
    }
  },
  mounted: async function () {
    this.isLoading = true
    const dataLimit = sessionStorage.getItem('subscriptionLimit')
    if (dataLimit !== null) {
      this.dataLimit = dataLimit
    }

    if (this.profileSubscriptions.videoList.length !== 0) {
      if (this.profileSubscriptions.activeProfile === this.activeProfile) {
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
      } else {
        this.getProfileSubscriptions()
      }

      this.isLoading = false
    } else {
      setTimeout(async () => {
        this.getSubscriptions()
      }, 300)
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

      let videoList = []
      let channelCount = 0

      this.activeSubscriptionList.forEach(async (channel) => {
        let videos = []

        if (!this.usingElectron || this.backendPreference === 'invidious') {
          if (useRss) {
            videos = await this.getChannelVideosInvidiousRSS(channel)
          } else {
            videos = await this.getChannelVideosInvidiousScraper(channel)
          }
        } else {
          if (useRss) {
            videos = await this.getChannelVideosLocalRSS(channel)
          } else {
            videos = await this.getChannelVideosLocalScraper(channel)
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

    getProfileSubscriptions: async function () {
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
    },

    getChannelVideosLocalScraper: function (channel, failedAttempts = 0) {
      return new Promise((resolve, reject) => {
        ytch.getChannelVideos(channel.id, 'latest').then(async (response) => {
          const videos = await Promise.all(response.items.map(async (video) => {
            if (video.liveNow) {
              video.publishedDate = new Date().getTime()
            } else {
              video.publishedDate = await this.calculatePublishedDate(video.publishedText)
            }
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
          switch (failedAttempts) {
            case 0:
              resolve(this.getChannelVideosLocalRSS(channel, failedAttempts + 1))
              break
            case 1:
              if (this.backendFallback) {
                this.showToast({
                  message: this.$t('Falling back to Invidious API')
                })
                resolve(this.getChannelVideosInvidiousScraper(channel, failedAttempts + 1))
              } else {
                resolve([])
              }
              break
            case 2:
              resolve(this.getChannelVideosLocalRSS(channel, failedAttempts + 1))
              break
            default:
              resolve([])
          }
        })
      })
    },

    getChannelVideosLocalRSS: function (channel, failedAttempts = 0) {
      return new Promise((resolve, reject) => {
        const parser = new Parser()
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`

        parser.parseURL(feedUrl).then(async (feed) => {
          const items = await Promise.all(feed.items.map((video) => {
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

          resolve(items)
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
          switch (failedAttempts) {
            case 0:
              resolve(this.getChannelVideosLocalScraper(channel, failedAttempts + 1))
              break
            case 1:
              if (this.backendFallback) {
                this.showToast({
                  message: this.$t('Falling back to Invidious API')
                })
                resolve(this.getChannelVideosInvidiousRSS(channel, failedAttempts + 1))
              } else {
                resolve([])
              }
              break
            case 2:
              resolve(this.getChannelVideosLocalScraper(channel, failedAttempts + 1))
              break
            default:
              resolve([])
          }
        })
      })
    },

    getChannelVideosInvidiousScraper: function (channel, failedAttempts = 0) {
      return new Promise((resolve, reject) => {
        const subscriptionsPayload = {
          resource: 'channels/latest',
          id: channel.id,
          params: {}
        }

        this.invidiousAPICall(subscriptionsPayload).then(async (result) => {
          resolve(await Promise.all(result.map((video) => {
            video.publishedDate = new Date(video.published * 1000)
            return video
          })))
        }).catch((err) => {
          console.log(err)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err.responseText}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(err)
            }
          })
          switch (failedAttempts) {
            case 0:
              resolve(this.getChannelVideosInvidiousRSS(channel, failedAttempts + 1))
              break
            case 1:
              if (this.backendFallback) {
                this.showToast({
                  message: this.$t('Falling back to the local API')
                })
                resolve(this.getChannelVideosLocalScraper(channel, failedAttempts + 1))
              } else {
                resolve([])
              }
              break
            case 2:
              resolve(this.getChannelVideosInvidiousRSS(channel, failedAttempts + 1))
              break
            default:
              resolve([])
          }
        })
      })
    },

    getChannelVideosInvidiousRSS: function (channel, failedAttempts = 0) {
      return new Promise((resolve, reject) => {
        const parser = new Parser()
        const feedUrl = `${this.invidiousInstance}/feed/channel/${channel.id}`

        parser.parseURL(feedUrl).then(async (feed) => {
          resolve(await Promise.all(feed.items.map((video) => {
            video.authorId = channel.id
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
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(err)
            }
          })
          switch (failedAttempts) {
            case 0:
              resolve(this.getChannelVideosInvidiousScraper(channel, failedAttempts + 1))
              break
            case 1:
              if (this.backendFallback) {
                this.showToast({
                  message: this.$t('Falling back to the local API')
                })
                resolve(this.getChannelVideosLocalRSS(channel, failedAttempts + 1))
              } else {
                resolve([])
              }
              break
            case 2:
              resolve(this.getChannelVideosInvidiousScraper(channel, failedAttempts + 1))
              break
            default:
              resolve([])
          }
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
