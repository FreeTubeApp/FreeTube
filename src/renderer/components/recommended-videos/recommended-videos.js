import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import RecommendedTabUI from '../recommended-tab-ui/recommended-tab-ui.vue'

import { setPublishedTimestampsInvidious, getRelativeTimeFromDate } from '../../helpers/utils'
import { invidiousAPICall } from '../../helpers/api/invidious'
import { updateVideoListAfterProcessing } from '../../helpers/subscriptions'

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
      if (localStorage.getItem('search-history') === null) {
        this.isLoading = false
        this.videoList = []
        return
      }

      const videoList = []
      this.isLoading = true

      this.updateShowProgressBar(true)
      this.setProgressBarPercentage(0)
      this.attemptedFetch = true

      const result = await this.getChannelVideosInvidiousScraper()

      videoList.push(...result.videos)
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
        const searchHistory = JSON.parse(localStorage.getItem('search-history')) || [];
        const numTerms = Math.min(4, searchHistory.length);
        const selectedTerms = [];

        // Select up to 4 random search terms
        while (selectedTerms.length < numTerms) {
          const index = Math.floor(Math.random() * searchHistory.length);
          if (!selectedTerms.includes(searchHistory[index])) {
            selectedTerms.push(searchHistory[index]);
          }
        }

        const promises = selectedTerms.map(queryTerm => {
          const recommendedPayload = {
            resource: 'search',
            params: {
              q: queryTerm + ' sort:date'
            }
          };

          return invidiousAPICall(recommendedPayload).then(videos => {
            setPublishedTimestampsInvidious(videos);
            return videos;
          }).catch(err => {
            console.error(err);
            return [];
          });
        });

        Promise.all(promises).then(results => {
          const allVideos = results.flat();
          let name;

          if (allVideos.length > 0) {
            name = allVideos.find(video => video.type === 'video' && video.author).author;
          }

          resolve({
            name,
            videos: allVideos
          });
        }).catch(err => {
          reject(err);
        });
      });
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
