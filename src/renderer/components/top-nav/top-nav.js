import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtInput from '../ft-input/ft-input.vue'
import FtProfileSelector from '../ft-profile-selector/ft-profile-selector.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import debounce from 'lodash.debounce'

import { IpcChannels, MOBILE_WIDTH_THRESHOLD } from '../../../constants'
import { openInternalPath } from '../../helpers/utils'
import { translateWindowTitle } from '../../helpers/strings'
import { clearLocalSearchSuggestionsSession, getLocalSearchSuggestions } from '../../helpers/api/local'
import { invidiousAPICall } from '../../helpers/api/invidious'

const NAV_HISTORY_DISPLAY_LIMIT = 15
const HALF_OF_NAV_HISTORY_DISPLAY_LIMIT = Math.floor(NAV_HISTORY_DISPLAY_LIMIT / 2)

export default defineComponent({
  name: 'TopNav',
  components: {
    FtIconButton,
    FtInput,
    FtProfileSelector
  },
  data: () => {
    return {
      component: this,
      showSearchContainer: true,
      isForwardOrBack: false,
      searchSuggestionsDataList: [],
      lastSuggestionQuery: ''
    }
  },
  computed: {
    arrowBackwardDisabled: function() {
      return this.sessionNavigationHistoryCurrentIndex === 0
    },

    arrowForwardDisabled: function() {
      return this.sessionNavigationHistoryCurrentIndex >= this.sessionNavigationHistory.length - 1
    },

    hideSearchBar: function () {
      return this.$store.getters.getHideSearchBar
    },

    hideHeaderLogo: function () {
      return this.$store.getters.getHideHeaderLogo
    },

    landingPage: function () {
      return this.$store.getters.getLandingPage
    },

    headerLogoTitle: function () {
      return this.$t('Go to page',
        {
          page: translateWindowTitle(this.$router.getRoutes()
            .find((route) => route.path === '/' + this.landingPage)
            .meta.title,
          this.$i18n
          )
        })
    },

    enableSearchSuggestions: function () {
      return this.$store.getters.getEnableSearchSuggestions
    },

    searchSettings: function () {
      return this.$store.getters.getSearchSettings
    },

    barColor: function () {
      return this.$store.getters.getBarColor
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    expandSideBar: function () {
      return this.$store.getters.getExpandSideBar
    },

    searchFilterValueChanged: function () {
      return this.$store.getters.getSearchFilterValueChanged
    },

    forwardText: function () {
      return this.$t('Forward')
    },

    backwardText: function () {
      return this.$t('Back')
    },

    newWindowText: function () {
      return this.$t('Open New Window')
    },

    sessionNavigationHistory: function () {
      return this.$store.getters.getSessionNavigationHistory
    },

    sessionNavigationHistoryCurrentIndex: function () {
      return this.$store.getters.getSessionNavigationHistoryCurrentIndex
    },

    sessionNavigationHistoryResultEndIndex: function () {
      if (this.sessionNavigationHistoryCurrentIndex < HALF_OF_NAV_HISTORY_DISPLAY_LIMIT) {
        return Math.min(this.sessionNavigationHistory.length - 1, NAV_HISTORY_DISPLAY_LIMIT - 1)
      } else if (this.sessionNavigationHistory.length - this.sessionNavigationHistoryCurrentIndex - 1 < HALF_OF_NAV_HISTORY_DISPLAY_LIMIT) {
        return this.sessionNavigationHistory.length - 1
      } else {
        return this.sessionNavigationHistoryCurrentIndex + HALF_OF_NAV_HISTORY_DISPLAY_LIMIT
      }
    },

    sessionNavigationHistoryDropdownOptions: function () {
      const dropdownOptions = []
      const end = this.sessionNavigationHistoryResultEndIndex
      for (let index = end; index >= Math.max(0, end + 1 - NAV_HISTORY_DISPLAY_LIMIT); --index) {
        const routeLabel = this.sessionNavigationHistory[index]
        dropdownOptions.push({
          // TODO: pass & show the more useful document.title instead
          // Difficult to do now because we update it asynchronously on some pages after an indeterminately long load
          label: translateWindowTitle(routeLabel, this.$i18n) ?? routeLabel,
          value: index - this.sessionNavigationHistoryCurrentIndex,
          active: index === this.sessionNavigationHistoryCurrentIndex
        })
      }
      return dropdownOptions
    },

  },
  mounted: function () {
    let previousWidth = window.innerWidth
    if (window.innerWidth <= MOBILE_WIDTH_THRESHOLD) {
      this.showSearchContainer = false
    }

    // Store is not up-to-date when the component mounts, so we use timeout.
    setTimeout(() => {
      if (this.expandSideBar) {
        this.toggleSideNav()
      }
    }, 0)

    window.addEventListener('resize', () => {
      // Don't change the status of showSearchContainer if only the height of the window changes
      // Opening the virtual keyboard can trigger this resize event, but it won't change the width
      if (previousWidth !== window.innerWidth) {
        this.showSearchContainer = window.innerWidth > MOBILE_WIDTH_THRESHOLD
        previousWidth = window.innerWidth
      }
    })

    this.debounceSearchResults = debounce(this.getSearchSuggestions, 200)
  },
  methods: {
    goToSearch: async function (query, { event }) {
      const doCreateNewWindow = event && event.shiftKey

      if (window.innerWidth <= MOBILE_WIDTH_THRESHOLD) {
        this.$refs.searchContainer.blur()
        this.showSearchContainer = false
      } else {
        this.$refs.searchInput.blur()
      }

      clearLocalSearchSuggestionsSession()

      this.getYoutubeUrlInfo(query).then((result) => {
        switch (result.urlType) {
          case 'video': {
            const { videoId, timestamp, playlistId } = result

            const query = {}
            if (timestamp) {
              query.timestamp = timestamp
            }
            if (playlistId && playlistId.length > 0) {
              query.playlistId = playlistId
            }

            openInternalPath({
              path: `/watch/${videoId}`,
              query,
              doCreateNewWindow
            })
            break
          }

          case 'playlist': {
            const { playlistId, query } = result

            openInternalPath({
              path: `/playlist/${playlistId}`,
              query,
              doCreateNewWindow
            })
            break
          }

          case 'search': {
            const { searchQuery, query } = result

            openInternalPath({
              path: `/search/${encodeURIComponent(searchQuery)}`,
              query,
              doCreateNewWindow,
              searchQueryText: searchQuery
            })
            break
          }

          case 'hashtag': {
            const { hashtag } = result
            openInternalPath({
              path: `/hashtag/${encodeURIComponent(hashtag)}`,
              doCreateNewWindow
            })

            break
          }

          case 'channel': {
            const { channelId, subPath, url } = result

            openInternalPath({
              path: `/channel/${channelId}/${subPath}`,
              doCreateNewWindow,
              query: {
                url
              }
            })
            break
          }

          case 'invalid_url':
          default: {
            openInternalPath({
              path: `/search/${encodeURIComponent(query)}`,
              query: {
                sortBy: this.searchSettings.sortBy,
                time: this.searchSettings.time,
                type: this.searchSettings.type,
                duration: this.searchSettings.duration,
                features: this.searchSettings.features,
              },
              doCreateNewWindow,
              searchQueryText: query
            })
          }
        }
      })
    },

    focusSearch: function () {
      if (!this.hideSearchBar) {
        // In order to prevent Klipper's "Synchronize contents of the clipboard
        // and the selection" feature from being triggered when running
        // Chromium on KDE Plasma, it seems both focus() focus and
        // select() have to be called asynchronously (see issue #2019).
        setTimeout(() => {
          this.$refs.searchInput.focus()
          this.$refs.searchInput.select()
        }, 0)
      }
    },

    getSearchSuggestionsDebounce: function (query) {
      if (this.enableSearchSuggestions) {
        const trimmedQuery = query.trim()
        if (trimmedQuery !== this.lastSuggestionQuery) {
          this.lastSuggestionQuery = trimmedQuery
          this.debounceSearchResults(trimmedQuery)
        }
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

      getLocalSearchSuggestions(query).then((results) => {
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

      invidiousAPICall(searchPayload).then((results) => {
        this.searchSuggestionsDataList = results.suggestions
      }).catch((err) => {
        console.error(err)
        if (process.env.SUPPORTS_LOCAL_API && this.backendFallback) {
          console.error(
            'Error gettings search suggestions.  Falling back to Local API'
          )
          this.getSearchSuggestionsLocal(query)
        }
      })
    },

    toggleSearchContainer: function () {
      this.showSearchContainer = !this.showSearchContainer
    },

    trackHistoryNavigation: function (toRoute) {
      if (!this.isForwardOrBack) {
        this.$store.commit('pushSessionNavigationHistoryState', toRoute)
      } else {
        this.isForwardOrBack = false
      }
    },

    historyBack: function (option = -1) {
      this.updateSessionNavigationIndexBy(option)
      this.isForwardOrBack = true
    },

    historyForward: function (option = 1) {
      this.updateSessionNavigationIndexBy(option)
      this.isForwardOrBack = true
    },

    updateSessionNavigationIndexBy: function (n) {
      // avoid reloading the page
      if (n === 0) {
        return
      }

      window.history.go(n)
      this.$store.commit('setSessionNavigationHistoryCurrentIndex', n + this.sessionNavigationHistoryCurrentIndex)
    },

    toggleSideNav: function () {
      this.$store.commit('toggleSideNav')
    },

    createNewWindow: function () {
      if (process.env.IS_ELECTRON) {
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.CREATE_NEW_WINDOW)
      } else {
        // Web placeholder
      }
    },
    navigate: function (route) {
      this.$router.push('/' + route)
    },
    updateSearchInputText: function (text) {
      this.$refs.searchInput.updateInputData(text)
    },
    ...mapActions([
      'getYoutubeUrlInfo',
      'showSearchFilters'
    ])
  }
})
