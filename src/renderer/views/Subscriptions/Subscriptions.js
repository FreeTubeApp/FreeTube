import Vue from 'vue'
import { mapActions, mapMutations } from 'vuex'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

import ytch from 'yt-channel-info'

export default Vue.extend({
  name: 'Subscriptions',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
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
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    profileList: function () {
      return this.$store.getters.getProfileList
    },

    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    profileSubscriptions: function () {
      return this.$store.getters.getProfileSubscriptions
    },

    activeSubscriptionList: function () {
      return this.profileList[this.activeProfile].subscriptions
    },

    allSubscriptionsList: function () {
      return this.profileList[0].subscriptions
    },

    sortedVideoList: function () {
      const profileSubscriptions = JSON.parse(JSON.stringify(this.profileSubscriptions))
      return profileSubscriptions.videoList.sort((a, b) => {
        if (a.title.toLowerCase() > b.title.toLowerCase()) {
          return -1
        }

        if (a.title.toLowerCase() < b.title.toLowerCase()) {
          return 1
        }

        console.log(a.title)

        return 0
      })
    }
  },
  mounted: function () {
    setTimeout(() => {
      this.fetchActiveSubscriptionsLocal()
    }, 1000)
  },
  methods: {
    fetchActiveSubscriptionsLocal: function () {
      if (this.activeSubscriptionList.length === 0) {
        return
      }
      this.isLoading = true
      this.updateShowProgressBar(true)

      let videoList = []
      let channelCount = 0

      this.activeSubscriptionList.forEach(async (channel) => {
        const videos = await this.getChannelVideosLocalScraper(channel.id)
        console.log(videos)

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

          this.updateProfileSubscriptions(profileSubscriptions)
          this.isLoading = false
          this.updateShowProgressBar(false)
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
      console.log('TODO')
    },

    fetchActiveSubscriptionsInvidious: function () {
      console.log('TODO')
    },

    getChannelVideosInvidiousScraper: function (channelId) {
      console.log('TODO')
    },

    getChannelVideosInvidiousRSS: function (channelId) {
      console.log('TODO')
    },

    ...mapActions([
      'showToast',
      'updateShowProgressBar',
      'updateProfileSubscriptions',
      'calculatePublishedDate'
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
