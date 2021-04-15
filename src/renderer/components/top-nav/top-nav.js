import Vue from 'vue'
import FtInput from '../ft-input/ft-input.vue'
import FtSearchFilters from '../ft-search-filters/ft-search-filters.vue'
import FtProfileSelector from '../ft-profile-selector/ft-profile-selector.vue'
import $ from 'jquery'
import router from '../../router/index.js'
import debounce from 'lodash.debounce'
import ytSuggest from 'youtube-suggest'
const { ipcRenderer } = require('electron')

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
  mounted: function () {
    const appWidth = $(window).width()

    if (appWidth <= 680) {
      const searchContainer = $('.searchContainer').get(0)
      searchContainer.style.display = 'none'
    }

    if (localStorage.getItem('expandSideBar') === 'true') {
      this.toggleSideNav()
    }

    window.addEventListener('resize', function (event) {
      const width = event.srcElement.innerWidth
      const searchContainer = $('.searchContainer').get(0)

      if (width > 680) {
        searchContainer.style.display = ''
      } else {
        searchContainer.style.display = 'none'
      }
    })

    this.debounceSearchResults = debounce(this.getSearchSuggestions, 200)
  },
  methods: {
    goToSearch: async function (query) {
      const appWidth = $(window).width()

      if (appWidth <= 680) {
        const searchContainer = $('.searchContainer').get(0)
        searchContainer.blur()
        searchContainer.style.display = 'none'
      } else {
        const searchInput = $('.searchInput input').get(0)
        searchInput.blur()
      }

      const { videoId, timestamp } = await this.$store.dispatch('getVideoParamsFromUrl', query)
      const playlistId = await this.$store.dispatch('getPlaylistIdFromUrl', query)

      console.log(playlistId)

      if (videoId) {
        this.$router.push({
          path: `/watch/${videoId}`,
          query: timestamp ? { timestamp } : {}
        })
      } else if (playlistId) {
        this.$router.push({
          path: `/playlist/${playlistId}`
        })
      } else {
        router.push({
          path: `/search/${encodeURIComponent(query)}`,
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
          this.getSearchSuggestionsLocal(query)
          break
        case 'invidious':
          this.getSearchSuggestionsInvidious(query)
          break
      }
    },

    getSearchSuggestionsLocal: function (query) {
      if (query === '') {
        this.searchSuggestionsDataList = []
        return
      }

      ytSuggest(query).then((results) => {
        this.searchSuggestionsDataList = results
      })
    },

    getSearchSuggestionsInvidious: function (query) {
      if (query === '') {
        this.searchSuggestionsDataList = []
        return
      }

      const searchPayload = {
        resource: 'search/suggestions',
        id: '',
        params: {
          q: query
        }
      }

      this.$store.dispatch('invidiousAPICall', searchPayload).then((results) => {
        this.searchSuggestionsDataList = results.suggestions
      }).catch((err) => {
        console.log(err)
        if (this.backendFallback) {
          console.log(
            'Error gettings search suggestions.  Falling back to Local API'
          )
          this.getSearchSuggestionsLocal(query)
        }
      })
    },

    toggleSearchContainer: function () {
      const searchContainer = $('.searchContainer').get(0)

      if (searchContainer.style.display === 'none') {
        searchContainer.style.display = ''
      } else {
        searchContainer.style.display = 'none'
      }

      this.showFilters = false
    },

    historyBack: function () {
      window.history.back()
    },

    historyForward: function () {
      window.history.forward()
    },

    toggleSideNav: function () {
      this.$store.commit('toggleSideNav')
    },

    createNewWindow: function () {
      ipcRenderer.send('createNewWindow')
    }
  }
})
