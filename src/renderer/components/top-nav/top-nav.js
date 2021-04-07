import Vue from 'vue'
import debounce from 'lodash.debounce'
import ytSuggest from 'youtube-suggest'
import FtInput from '../ft-input/ft-input.vue'
import FtSearchFilters from '../ft-search-filters/ft-search-filters.vue'
import FtProfileSelector from '../ft-profile-selector/ft-profile-selector.vue'
import router from '../../router/index.js'

export default Vue.extend({
  name: 'TopNav',
  components: {
    FtInput,
    FtSearchFilters,
    FtProfileSelector
  },
  data: () => {
    return {
      component: this,
      windowWidth: 0,
      showFilters: false,
      showSearch: false,
      searchSuggestionsDataList: []
    }
  },
  computed: {
    enableSearchSuggestions: function () {
      return this.$store.getters.getEnableSearchSuggestions
    },

    searchSettings: function () {
      return this.$store.getters.getSearchSettings
    },

    isSideNavOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    },

    barColor: function () {
      return this.$store.getters.getBarColor
    },

    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    }
  },
  mounted() {
    if (localStorage.getItem('expandSideBar') === 'true') {
      this.toggleSideNav()
    }

    this.debounceSearchResults = debounce(this.getSearchSuggestions, 200)
  },
  methods: {
    goToSearch: async function (query) {
      const { videoId, timestamp } = await this.$store.dispatch('getVideoParamsFromUrl', query)
      const playlistId = await this.$store.dispatch('getPlaylistIdFromUrl', query)

      console.log(playlistId)

      if (videoId) {
        const nextPath = `/watch/${videoId}`
        if (nextPath === this.$router.history.current.path) {
          return
        }
        this.$router.push({
          path: nextPath,
          query: timestamp ? { timestamp } : {}
        })
      } else if (playlistId) {
        const nextPath = `/playlist/${playlistId}`
        if (nextPath === this.$router.history.current.path) {
          return
        }
        this.$router.push({
          path: nextPath
        })
      } else {
        const nextPath = `/search/${encodeURIComponent(query)}`
        if (nextPath === this.$router.history.current.path) {
          return
        }
        router.push({
          path: nextPath,
          query: {
            sortBy: this.searchSettings.sortBy,
            time: this.searchSettings.time,
            type: this.searchSettings.type,
            duration: this.searchSettings.duration
          }
        })
      }

      this.showFilters = false
    },

    getSearchSuggestionsDebounce: function (query) {
      if (this.enableSearchSuggestions) {
        this.debounceSearchResults(query)
      }
    },

    getSearchSuggestions: function (query) {
      switch (this.backendPreference) {
        case 'local':
          return this.getSearchSuggestionsLocal(query)
        case 'invidious':
          return this.getSearchSuggestionsInvidious(query)
      }
    },

    getSearchSuggestionsLocal: function (query) {
      if (query === '') {
        this.searchSuggestionsDataList = []
        return Promise.resolve()
      }

      return ytSuggest(query).then((results) => {
        this.searchSuggestionsDataList = results
      })
    },

    getSearchSuggestionsInvidious: function (query) {
      if (query === '') {
        this.searchSuggestionsDataList = []
        return Promise.resolve()
      }

      const searchPayload = {
        resource: 'search/suggestions',
        id: '',
        params: {
          q: query
        }
      }

      return this.$store.dispatch('invidiousAPICall', searchPayload)
        .then((results) => {
          this.searchSuggestionsDataList = results.suggestions
        })
        .catch((err) => {
          console.log(err)
          if (this.backendFallback) {
            console.log(
              'Error gettings search suggestions.  Falling back to Local API'
            )
            return this.getSearchSuggestionsLocal(query)
          }
          throw err
        })
    },

    toggleSearchContainer: function () {
      this.showSearch = !this.showSearch
      this.showFilters = !this.showFilters
    },

    historyBack: function () {
      window.history.back()
    },

    historyForward: function () {
      window.history.forward()
    },

    toggleSideNav: function () {
      this.$store.commit('toggleSideNav')
    }
  }
})
