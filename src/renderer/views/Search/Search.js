import Vue from 'vue'
import { mapActions } from 'vuex'
import IsEqual from 'lodash.isequal'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import ytTrendScraper from 'yt-trending-scraper'

export default Vue.extend({
  name: 'Search',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-element-list': FtElementList
  },
  data: function () {
    return {
      isLoading: false,
      apiUsed: 'local',
      amountOfResults: 0,
      query: '',
      searchPage: 1,
      nextPageRef: '',
      lastSearchQuery: '',
      searchSettings: {},
      shownResults: []
    }
  },
  computed: {
    sessionSearchHistory: function () {
      return this.$store.getters.getSessionSearchHistory
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    }
  },
  watch: {
    $route () {
      // react to route changes...

      const query = this.$route.params.query
      const searchSettings = {
        sortBy: this.$route.query.sortBy,
        time: this.$route.query.time,
        type: this.$route.query.type,
        duration: this.$route.query.duration
      }

      const payload = {
        query: query,
        nextPage: false,
        options: {},
        searchSettings: searchSettings
      }

      this.query = query

      this.checkSearchCache(payload)
    }
  },
  mounted: function () {
    this.query = this.$route.params.query
    console.log(this.$route)

    this.searchSettings = {
      sortBy: this.$route.query.sortBy,
      time: this.$route.query.time,
      type: this.$route.query.type,
      duration: this.$route.query.duration
    }

    const payload = {
      query: this.query,
      nextPage: false,
      options: {},
      searchSettings: this.searchSettings
    }

    this.checkSearchCache(payload)
  },
  methods: {
    checkSearchCache: function (payload) {
      const sameSearch = this.sessionSearchHistory.filter((search) => {
        return search.query === payload.query && IsEqual(payload.searchSettings, search.searchSettings)
      })

      this.shownResults = []
      this.isLoading = true

      if (sameSearch.length > 0) {
        console.log(sameSearch)
        // Replacing the data right away causes a strange error where the data
        // Shown is mixed from 2 different search results.  So we'll wait a moment
        // Before showing the results.
        setTimeout(this.replaceShownResults, 100, sameSearch[0])
      } else {
        this.searchSettings = payload.searchSettings

        switch (this.backendPreference) {
          case 'local':
            this.performSearchLocal(payload)
            break
          case 'invidious':
            this.performSearchInvidious(payload)
            break
        }
      }
    },

    performSearchLocal: function (payload) {
      if (!payload.nextPage) {
        this.isLoading = true
        payload.options.pages = 1
      }

      this.$store.dispatch('ytSearch', payload).then((result) => {
        console.log(result)
        if (!result) {
          return
        }

        this.apiUsed = 'local'

        this.amountOfResults = result.results

        const returnData = result.items.filter((item) => {
          if (typeof item !== 'undefined') {
            return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
          }

          return null
        })

        const dataToShow = []
        returnData.forEach((video) => {
          if (video.type === 'video') {
            const authId = video.author.channelID
            const publishDate = video.uploadedAt
            let videoDuration = video.duration
            const videoId = video.id
            if (videoDuration !== null && videoDuration !== '' && videoDuration !== 'LIVE') {
              videoDuration = ytTrendScraper.calculate_length_in_seconds(video.duration)
            }
            dataToShow.push(
              {
                videoId: videoId,
                title: video.title,
                type: 'video',
                author: video.author.name,
                authorId: authId,
                authorUrl: video.author.url,
                videoThumbnails: video.thumbnail,
                description: video.description,
                viewCount: video.views,
                published: publishDate,
                publishedText: publishDate,
                lengthSeconds: videoDuration,
                liveNow: video.isLive || videoDuration === 'LIVE',
                paid: false,
                premium: false,
                isUpcoming: false,
                timeText: videoDuration
              }
            )
          } else {
            dataToShow.push(video)
          }
        })

        if (payload.nextPage) {
          this.shownResults = this.shownResults.concat(dataToShow)
        } else {
          this.shownResults = dataToShow
        }

        this.nextPageRef = result.continuation
        this.isLoading = false

        const historyPayload = {
          query: payload.query,
          data: this.shownResults,
          searchSettings: this.searchSettings,
          nextPageRef: result.continuation,
          amountOfResults: result.results
        }

        this.$store.commit('addToSessionSearchHistory', historyPayload)
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
        if (this.backendPreference === 'local' && this.backendFallback) {
          this.showToast({
            message: this.$t('Falling back to Invidious API')
          })
          this.performSearchInvidious(payload)
        } else {
          this.isLoading = false
        }
      })
    },

    performSearchInvidious: function (payload) {
      if (this.searchPage === 1) {
        this.isLoading = true
      }
      console.log(payload)

      const searchPayload = {
        resource: 'search',
        id: '',
        params: {
          q: payload.query,
          page: this.searchPage,
          sort_by: payload.searchSettings.sortBy,
          date: payload.searchSettings.time,
          duration: payload.searchSettings.duration,
          type: payload.searchSettings.type
        }
      }

      this.$store.dispatch('invidiousAPICall', searchPayload).then((result) => {
        if (!result) {
          return
        }

        this.apiUsed = 'invidious'

        console.log(result)

        const returnData = result.filter((item) => {
          return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
        })

        console.log(returnData)

        if (this.searchPage !== 1) {
          this.shownResults = this.shownResults.concat(returnData)
        } else {
          this.shownResults = returnData
        }

        this.searchPage++
        this.isLoading = false

        const historyPayload = {
          query: payload.query,
          data: this.shownResults,
          searchSettings: this.searchSettings,
          searchPage: this.searchPage
        }

        this.$store.commit('addToSessionSearchHistory', historyPayload)
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
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          this.showToast({
            message: this.$t('Falling back to Local API')
          })
          this.performSearchLocal(payload)
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    nextPage: function () {
      const payload = {
        query: this.query,
        nextPage: true,
        searchSettings: this.searchSettings,
        options: {
          nextpageRef: this.nextPageRef
        }
      }

      console.log(payload)

      if (this.apiUsed === 'local') {
        if (this.amountOfResults <= this.shownResults.length) {
          this.showToast({
            message: this.$t('Search Filters.There are no more results for this search')
          })
        } else {
          this.showToast({
            message: this.$t('Search Filters["Fetching results. Please wait"]')
          })
          this.performSearchLocal(payload)
        }
      } else {
        this.showToast({
          message: this.$t('Search Filters["Fetching results. Please wait"]')
        })
        this.performSearchInvidious(payload)
      }
    },

    replaceShownResults: function (history) {
      this.query = history.query
      this.shownResults = history.data
      this.searchSettings = history.searchSettings
      this.amountOfResults = history.amountOfResults

      if (typeof (history.nextPageRef) !== 'undefined') {
        this.nextPageRef = history.nextPageRef
      }

      if (typeof (history.searchPage) !== 'undefined') {
        this.searchPage = history.searchPage
      }

      this.isLoading = false
    },

    ...mapActions([
      'showToast'
    ])
  }
})
