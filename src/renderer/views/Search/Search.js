import { defineComponent } from 'vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import { copyToClipboard, searchFiltersMatch, showToast } from '../../helpers/utils'
import { getLocalSearchContinuation, getLocalSearchResults } from '../../helpers/api/local'
import { invidiousAPICall } from '../../helpers/api/invidious'

export default defineComponent({
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
      nextPageRef: null,
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
    },

    hideLiveStreams: function() {
      return this.$store.getters.getHideLiveStreams
    },

    hideUpcomingPremieres: function () {
      return this.$store.getters.getHideUpcomingPremieres
    },

    showFamilyFriendlyOnly: function() {
      return this.$store.getters.getShowFamilyFriendlyOnly
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
        options: {},
        searchSettings: searchSettings
      }

      this.query = query

      this.checkSearchCache(payload)
    }
  },
  mounted: function () {
    this.query = this.$route.params.query

    this.searchSettings = {
      sortBy: this.$route.query.sortBy,
      time: this.$route.query.time,
      type: this.$route.query.type,
      duration: this.$route.query.duration
    }

    const payload = {
      query: this.query,
      options: {},
      searchSettings: this.searchSettings
    }

    this.checkSearchCache(payload)
  },
  methods: {
    checkSearchCache: function (payload) {
      const sameSearch = this.sessionSearchHistory.filter((search) => {
        return search.query === payload.query && searchFiltersMatch(payload.searchSettings, search.searchSettings)
      })

      this.shownResults = []
      this.isLoading = true

      if (sameSearch.length > 0) {
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

    performSearchLocal: async function (payload) {
      this.isLoading = true

      try {
        const { results, continuationData } = await getLocalSearchResults(payload.query, payload.searchSettings, this.showFamilyFriendlyOnly)

        if (results.length === 0) {
          return
        }

        this.apiUsed = 'local'

        this.shownResults = results
        this.nextPageRef = continuationData

        this.isLoading = false

        const historyPayload = {
          query: payload.query,
          data: this.shownResults,
          searchSettings: this.searchSettings,
          nextPageRef: this.nextPageRef
        }

        this.$store.commit('addToSessionSearchHistory', historyPayload)
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.performSearchInvidious(payload)
        } else {
          this.isLoading = false
        }
      }
    },

    getNextpageLocal: async function (payload) {
      try {
        const { results, continuationData } = await getLocalSearchContinuation(payload.options.nextPageRef)

        if (results.length === 0) {
          return
        }

        this.apiUsed = 'local'

        this.shownResults = this.shownResults.concat(results)
        this.nextPageRef = continuationData

        const historyPayload = {
          query: payload.query,
          data: this.shownResults,
          searchSettings: this.searchSettings,
          nextPageRef: this.nextPageRef
        }

        this.$store.commit('addToSessionSearchHistory', historyPayload)
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.performSearchInvidious(payload)
        } else {
          this.isLoading = false
        }
      }
    },

    performSearchInvidious: function (payload) {
      if (this.searchPage === 1) {
        this.isLoading = true
      }

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

      invidiousAPICall(searchPayload).then((result) => {
        if (!result) {
          return
        }

        this.apiUsed = 'invidious'

        const returnData = result.filter((item) => {
          return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
        })

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
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (process.env.IS_ELECTRON && this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
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
        searchSettings: this.searchSettings,
        options: {
          nextPageRef: this.nextPageRef
        }
      }

      if (this.apiUsed === 'local') {
        if (this.nextPageRef !== null) {
          showToast(this.$t('Search Filters["Fetching results. Please wait"]'))
          this.getNextpageLocal(payload)
        } else {
          showToast(this.$t('Search Filters.There are no more results for this search'))
        }
      } else {
        showToast(this.$t('Search Filters["Fetching results. Please wait"]'))
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
    }
  }
})
