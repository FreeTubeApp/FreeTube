import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtChannelBubble from '../../components/ft-channel-bubble/ft-channel-bubble.vue'

import { MAIN_PROFILE_ID } from '../../../constants'
import { calculatePublishedDate, copyToClipboard, showToast } from '../../helpers/utils'
import { invidiousAPICall } from '../../helpers/api/invidious'
import { getLocalChannelVideos } from '../../helpers/api/local'

export default defineComponent({
  name: 'Subscriptions',
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
      attemptedFetch: false
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
    }
  },
  watch: {
    activeProfile: async function (_) {
      this.getProfileSubscriptions()
    }
  },
  mounted: async function () {
    document.addEventListener('keydown', this.keyboardShortcutHandler)

    this.isLoading = true
    const dataLimit = sessionStorage.getItem('subscriptionLimit')
    if (dataLimit !== null) {
      this.dataLimit = dataLimit
    }

    if (this.profileSubscriptions.videoList.length !== 0) {
      if (this.profileSubscriptions.activeProfile === this.activeProfile._id) {
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
          this.errorChannels = subscriptionList.errorChannels
        }
      } else {
        this.getProfileSubscriptions()
      }

      this.isLoading = false
    } else if (this.fetchSubscriptionsAutomatically) {
      setTimeout(async () => {
        this.getSubscriptions()
      }, 300)
    } else {
      this.isLoading = false
    }
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
  },
  methods: {
    goToChannel: function (id) {
      this.$router.push({ path: `/channel/${id}` })
    },

    getSubscriptions: function () {
      if (this.activeSubscriptionList.length === 0) {
        this.isLoading = false
        this.videoList = []
        return
      }

      let useRss = this.useRssFeeds
      if (this.activeSubscriptionList.length >= 125 && !useRss) {
        showToast(
          this.$t('Subscriptions["This profile has a large number of subscriptions.  Forcing RSS to avoid rate limiting"]'),
          10000
        )
        useRss = true
      }
      this.isLoading = true
      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)
      this.attemptedFetch = true

      let videoList = []
      let channelCount = 0
      this.errorChannels = []
      this.activeSubscriptionList.forEach(async (channel) => {
        let videos = []
        if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
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
              return item.durationText !== 'PREMIERE'
            })
          }
          const profileSubscriptions = {
            activeProfile: this.activeProfile._id,
            videoList: videoList,
            errorChannels: this.errorChannels
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

          if (this.activeProfile === MAIN_PROFILE_ID) {
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
      } else if (this.fetchSubscriptionsAutomatically) {
        this.getSubscriptions()
      } else if (this.activeProfile._id === this.profileSubscriptions.activeProfile) {
        this.videoList = this.profileSubscriptions.videoList
      } else {
        this.videoList = []
        this.attemptedFetch = false
      }
    },

    getChannelVideosLocalScraper: async function (channel, failedAttempts = 0) {
      try {
        const videos = await getLocalChannelVideos(channel.id)

        if (videos === null) {
          this.errorChannels.push(channel)
          return []
        }

        videos.map(video => {
          if (video.liveNow) {
            video.publishedDate = new Date().getTime()
          } else {
            video.publishedDate = calculatePublishedDate(video.publishedText)
          }
          return video
        })

        return videos
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        switch (failedAttempts) {
          case 0:
            return await this.getChannelVideosLocalRSS(channel, failedAttempts + 1)
          case 1:
            if (this.backendFallback) {
              showToast(this.$t('Falling back to Invidious API'))
              return await this.getChannelVideosInvidiousScraper(channel, failedAttempts + 1)
            } else {
              return []
            }
          case 2:
            return await this.getChannelVideosLocalRSS(channel, failedAttempts + 1)
          default:
            return []
        }
      }
    },

    getChannelVideosLocalRSS: async function (channel, failedAttempts = 0) {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`

      try {
        const response = await fetch(feedUrl)

        if (response.status === 404) {
          this.errorChannels.push(channel)
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
            return this.getChannelVideosLocalScraper(channel, failedAttempts + 1)
          case 1:
            if (this.backendFallback) {
              showToast(this.$t('Falling back to Invidious API'))
              return this.getChannelVideosInvidiousRSS(channel, failedAttempts + 1)
            } else {
              return []
            }
          case 2:
            return this.getChannelVideosLocalScraper(channel, failedAttempts + 1)
          default:
            return []
        }
      }
    },

    getChannelVideosInvidiousScraper: function (channel, failedAttempts = 0) {
      return new Promise((resolve, reject) => {
        const subscriptionsPayload = {
          resource: 'channels/latest',
          id: channel.id,
          params: {}
        }

        invidiousAPICall(subscriptionsPayload).then(async (result) => {
          resolve(await Promise.all(result.videos.map((video) => {
            video.publishedDate = new Date(video.published * 1000)
            return video
          })))
        }).catch((err) => {
          console.error(err)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          showToast(`${errorMessage}: ${err.responseText}`, 10000, () => {
            copyToClipboard(err.responseText)
          })
          switch (failedAttempts) {
            case 0:
              resolve(this.getChannelVideosInvidiousRSS(channel, failedAttempts + 1))
              break
            case 1:
              if (process.env.IS_ELECTRON && this.backendFallback) {
                showToast(this.$t('Falling back to the local API'))
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

    getChannelVideosInvidiousRSS: async function (channel, failedAttempts = 0) {
      const feedUrl = `${this.currentInvidiousInstance}/feed/channel/${channel.id}`

      try {
        const response = await fetch(feedUrl)

        if (response.status === 500) {
          this.errorChannels.push(channel)
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
            return this.getChannelVideosInvidiousScraper(channel, failedAttempts + 1)
          case 1:
            if (process.env.IS_ELECTRON && this.backendFallback) {
              showToast(this.$t('Falling back to the local API'))
              return this.getChannelVideosLocalRSS(channel, failedAttempts + 1)
            } else {
              return []
            }
          case 2:
            return this.getChannelVideosInvidiousScraper(channel, failedAttempts + 1)
          default:
            return []
        }
      }
    },

    async parseYouTubeRSSFeed(rssString, channelId) {
      const xmlDom = new DOMParser().parseFromString(rssString, 'application/xml')

      const channelName = xmlDom.querySelector('author > name').textContent
      const entries = xmlDom.querySelectorAll('entry')

      const promises = []

      for (const entry of entries) {
        promises.push(this.parseRSSEntry(entry, channelId, channelName))
      }

      return await Promise.all(promises)
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

    // This function should always be at the bottom of this file
    keyboardShortcutHandler: function (event) {
      if (event.ctrlKey || document.activeElement.classList.contains('ft-input')) {
        return
      }
      switch (event.key) {
        case 'r':
        case 'R':
          if (!this.isLoading) {
            this.getSubscriptions()
          }
          break
      }
    },

    ...mapActions([
      'updateShowProgressBar',
      'updateProfileSubscriptions',
      'updateAllSubscriptionsList'
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
