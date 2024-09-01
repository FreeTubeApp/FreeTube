import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import RecommendedTabUI from '../recommended-tab-ui/recommended-tab-ui.vue'

import { setPublishedTimestampsInvidious, copyToClipboard, getRelativeTimeFromDate, showToast } from '../../helpers/utils'
import { invidiousAPICall, invidiousFetch } from '../../helpers/api/invidious'
import { getLocalChannelVideos } from '../../helpers/api/local'
import { parseYouTubeRSSFeed, updateVideoListAfterProcessing } from '../../helpers/subscriptions'

export default defineComponent({
  name: 'RecommendedVideos',
  components: {
    'recommended-tab-ui': RecommendedTabUI
  },
  data: function () {
    return {
      isLoading: false,
      videoList: [],
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

    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
    },

    lastVideoRefreshTimestamp: function () {
      return getRelativeTimeFromDate(this.$store.getters.getLastVideoRefreshTimestampByProfile(this.activeProfileId), true)
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
      // clear timestamp if not all entries are present in the cache
      this.updateLastVideoRefreshTimestampByProfile({ profileId: this.activeProfileId, timestamp: '' })
      this.maybeLoadVideosForSubscriptionsFromRemote()
    },

    loadVideosForSubscriptionsFromRemote: async function () {
      console.log("loadVideosForSubscriptionsFromRemote")
      if (localStorage.getItem("search-history") === null) {
        this.isLoading = false
        this.videoList = []
        console.log("search-history is empty")
        return
      }

      const videoList = []
      this.isLoading = true

      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)
      this.attemptedFetch = true

      let videos, name, thumbnailUrl

      ({ videos, name, thumbnailUrl } = await this.getChannelVideosInvidiousScraper())
      let videoListFromRemote = videos
  
      videoList.push(...videoListFromRemote)
      this.updateLastVideoRefreshTimestampByProfile({ profileId: this.activeProfileId, timestamp: new Date() })

      this.videoList = updateVideoListAfterProcessing(videoList)
      this.isLoading = false
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

    getChannelVideosInvidiousScraper: function (failedAttempts = 0) {
      return new Promise((resolve, reject) => {
      
        let search_history = JSON.parse(localStorage.getItem("search-history"))
        let index = Math.round(Math.random() * (search_history.length - 1))
        let query_term = search_history[index]
        
        const recommendedPayload = {
          resource: 'search',
          params: {
            q: query_term + " sort:date"
          }
        }

        invidiousAPICall(recommendedPayload).then((videos) => {
          console.log("invidiousAPICall result", videos)
          setPublishedTimestampsInvidious(videos)

          let name

          if (videos.length > 0) {
            name =videos.find(video => video.type === 'video' && video.author).author
          }

          resolve({
            name,
            videos: videos
          })
        }).catch((err) => {
          console.error(err)
        })
      })
    },
    
    ...mapActions([
      'batchUpdateSubscriptionDetails',
      'updateShowProgressBar',
      'updateSubscriptionVideosCacheByChannel',
      'updateLastVideoRefreshTimestampByProfile'
    ]),

    ...mapMutations([
      'setProgressBarPercentage'
    ])
  }
})
