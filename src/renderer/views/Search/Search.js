import { defineComponent } from 'vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtAutoLoadNextPageWrapper from '../../components/ft-auto-load-next-page-wrapper/ft-auto-load-next-page-wrapper.vue'
import {
  copyToClipboard,
  searchFiltersMatch,
  setPublishedTimestampsInvidious,
  showToast,
} from '../../helpers/utils'
import { getLocalSearchContinuation, getLocalSearchResults } from '../../helpers/api/local'
import { invidiousAPICall } from '../../helpers/api/invidious'
import { SEARCH_CHAR_LIMIT } from '../../../constants'

export default defineComponent({
  name: 'Search',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-element-list': FtElementList,
    'ft-auto-load-next-page-wrapper': FtAutoLoadNextPageWrapper,
  },
  data: function () {
    return {
      isLoading: false,
      apiUsed: 'local',
      amountOfResults: 0,
      query: '',
      searchPage: 1,
      nextPageRef: null,
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

    showFamilyFriendlyOnly: function() {
      return this.$store.getters.getShowFamilyFriendlyOnly
    },
  },
  watch: {
    $route () {
      // react to route changes...

      const query = this.$route.params.query
      let features = this.$route.query.features
      // if page gets refreshed and there's only one feature then it will be a string
      if (typeof features === 'string') {
        features = [features]
      }
      const searchSettings = {
        sortBy: this.$route.query.sortBy,
        time: this.$route.query.time,
        type: this.$route.query.type,
        duration: this.$route.query.duration,
        features: features,
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

    let features = this.$route.query.features
    // if page gets refreshed and there's only one feature then it will be a string
    if (typeof features === 'string') {
      features = [features]
    }

    this.searchSettings = {
      sortBy: this.$route.query.sortBy,
      time: this.$route.query.time,
      type: this.$route.query.type,
      duration: this.$route.query.duration,
      features: features,
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
      if (payload.query.length > SEARCH_CHAR_LIMIT) {
        console.warn(`Search character limit is: ${SEARCH_CHAR_LIMIT}`)
        showToast(this.$t('Search character limit', { searchCharacterLimit: SEARCH_CHAR_LIMIT }))
        return
      }

      const sameSearch = this.sessionSearchHistory.filter((search) => {
        return search.query === payload.query && searchFiltersMatch(payload.searchSettings, search.searchSettings)
      })

      if (sameSearch.length > 0) {
        // No loading effect needed here, only rendered result update
        this.replaceShownResults(sameSearch[0])
      } else {
        // Show loading effect coz there will be network request(s)
        this.isLoading = true
        this.searchSettings = payload.searchSettings

        switch (this.backendPreference) {
          case 'local':
            this.performSearchLocal(payload)
            break
          case 'invidious':
            this.performSearchInvidious(payload, { resetSearchPage: true })
            break
        }
      }
    },

    performSearchLocal: async function (payload) {
      this.isLoading = true

      try {
        const { results, continuationData } = await getLocalSearchResults(payload.query, payload.searchSettings, this.showFamilyFriendlyOnly)

        this.apiUsed = 'local'

        this.shownResults = results
        this.nextPageRef = continuationData

        this.isLoading = false

        const historyPayload = {
          query: payload.query,
          data: this.shownResults,
          searchSettings: this.searchSettings,
          nextPageRef: this.nextPageRef,
          apiUsed: this.apiUsed
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
          nextPageRef: this.nextPageRef,
          apiUsed: this.apiUsed
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

    performSearchInvidious: function (payload, options = { resetSearchPage: false }) {
      if (options.resetSearchPage) {
        this.searchPage = 1
      }
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
          type: payload.searchSettings.type,
          features: payload.searchSettings.features.join(',')
        }
      }

      invidiousAPICall(searchPayload).then((result) => {
        if (!result) {
          return
        }

        this.apiUsed = 'invidious'

        const returnData = result.filter((item) => {
          return item.type === 'video' || item.type === 'channel' || item.type === 'playlist' || item.type === 'hashtag'
        })

        setPublishedTimestampsInvidious(returnData.filter(item => item.type === 'video'))

        if (this.searchPage !== 1) {
          this.shownResults = this.shownResults.concat(returnData)
        } else {
          this.shownResults = returnData
        }

        this.isLoading = false

        this.searchPage++

        const historyPayload = {
          query: payload.query,
          data: this.shownResults,
          searchSettings: this.searchSettings,
          searchPage: this.searchPage,
          apiUsed: this.apiUsed
        }

        this.$store.commit('addToSessionSearchHistory', historyPayload)
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (process.env.SUPPORTS_LOCAL_API && this.backendPreference === 'invidious' && this.backendFallback) {
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
      this.apiUsed = history.apiUsed

      if (typeof (history.nextPageRef) !== 'undefined') {
        this.nextPageRef = history.nextPageRef
      }

      if (typeof (history.searchPage) !== 'undefined') {
        this.searchPage = history.searchPage
      }

      // This is kept in case there is some race condition
      this.isLoading = false
    }
  }
})
