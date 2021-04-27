import Vue from 'vue'
import FtInput from '../ft-input/ft-input.vue'
import FtSearchFilters from '../ft-search-filters/ft-search-filters.vue'
import FtProfileSelector from '../ft-profile-selector/ft-profile-selector.vue'
import $ from 'jquery'
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

      this.$store.dispatch('getYoutubeUrlInfo', query).then((result) => {
        switch (result.urlType) {
          case 'video': {
            const { videoId, timestamp } = result

            this.$router.push({
              path: `/watch/${videoId}`,
              query: timestamp ? { timestamp } : {}
            })
            break
          }

          case 'playlist': {
            const { playlistId, query } = result

            this.$router.push({
              path: `/playlist/${playlistId}`,
              query
            })
            break
          }

          case 'search': {
            const { searchQuery, query } = result

            this.$router.push({
              path: `/search/${encodeURIComponent(searchQuery)}`,
              query
            })
            break
          }

          case 'hashtag': {
            // TODO: Implement a hashtag related view
            let message = 'Hashtags have not yet been implemented, try again later'
            if (this.$te(message) && this.$t(message) !== '') {
              message = this.$t(message)
            }

            this.showToast({
              message: message
            })
            break
          }

          case 'channel': {
            const { channelId } = result

            this.$router.push({
              path: `/channel/${channelId}`
            })
            break
          }

          case 'invalid_url':
          default: {
            this.$router.push({
              path: `/search/${encodeURIComponent(query)}`,
              query: {
                sortBy: this.searchSettings.sortBy,
                time: this.searchSettings.time,
                type: this.searchSettings.type,
                duration: this.searchSettings.duration
              }
            })
          }
        }
      })

      // Close the filter panel
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
