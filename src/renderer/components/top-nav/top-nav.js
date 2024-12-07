import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtInput from '../ft-input/ft-input.vue'
import FtProfileSelector from '../ft-profile-selector/ft-profile-selector.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import debounce from 'lodash.debounce'

import { IpcChannels, KeyboardShortcuts, MOBILE_WIDTH_THRESHOLD } from '../../../constants'
import { localizeAndAddKeyboardShortcutToActionTitle, openInternalPath } from '../../helpers/utils'
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
    let isArrowBackwardDisabled = true
    let isArrowForwardDisabled = true

    // If the Navigation API isn't supported (Firefox and Safari)
    // keep the back and forwards buttons always enabled
    if (!('navigation' in window)) {
      isArrowBackwardDisabled = false
      isArrowForwardDisabled = false
    }

    return {
      showSearchContainer: true,
      isArrowBackwardDisabled,
      isArrowForwardDisabled,
      navigationHistoryDropdownActiveEntry: null,
      navigationHistoryDropdownOptions: [],
      searchSuggestionsDataList: [],
      lastSuggestionQuery: ''
    }
  },
  computed: {
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
            .meta.title
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

    navigationHistoryAddendum: function () {
      if (this.navigationHistoryDropdownOptions.length === 0) {
        return ''
      }

      return '\n' + this.$t('Right-click or hold to see history')
    },

    forwardText: function () {
      return localizeAndAddKeyboardShortcutToActionTitle(
        this.$t('Forward'),
        KeyboardShortcuts.APP.GENERAL.HISTORY_FORWARD
      ) + this.navigationHistoryAddendum
    },

    backwardText: function () {
      return localizeAndAddKeyboardShortcutToActionTitle(
        this.$t('Back'),
        KeyboardShortcuts.APP.GENERAL.HISTORY_BACKWARD
      ) + this.navigationHistoryAddendum
    },

    newWindowText: function () {
      return localizeAndAddKeyboardShortcutToActionTitle(
        this.$t('Open New Window'),
        KeyboardShortcuts.APP.GENERAL.NEW_WINDOW
      )
    }
  },
  watch: {
    $route: function () {
      this.setNavigationHistoryDropdownOptions()
      if ('navigation' in window) {
        this.isArrowForwardDisabled = !window.navigation.canGoForward
        this.isArrowBackwardDisabled = !window.navigation.canGoBack
      }
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
    goToSearch: async function (queryText, { event }) {
      const doCreateNewWindow = event && event.shiftKey

      if (window.innerWidth <= MOBILE_WIDTH_THRESHOLD) {
        this.$refs.searchContainer.blur()
        this.showSearchContainer = false
      } else {
        this.$refs.searchInput.blur()
      }

      clearLocalSearchSuggestionsSession()

      this.getYoutubeUrlInfo(queryText).then((result) => {
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
              doCreateNewWindow,
              searchQueryText: queryText,
            })
            break
          }

          case 'playlist': {
            const { playlistId, query } = result

            openInternalPath({
              path: `/playlist/${playlistId}`,
              query,
              doCreateNewWindow,
              searchQueryText: queryText,
            })
            break
          }

          case 'search': {
            const { searchQuery, query } = result

            openInternalPath({
              path: `/search/${encodeURIComponent(searchQuery)}`,
              query,
              doCreateNewWindow,
              searchQueryText: searchQuery,
            })
            break
          }

          case 'hashtag': {
            const { hashtag } = result
            openInternalPath({
              path: `/hashtag/${encodeURIComponent(hashtag)}`,
              doCreateNewWindow,
              searchQueryText: `#${hashtag}`,
            })

            break
          }

          case 'post': {
            const { postId, query } = result

            openInternalPath({
              path: `/post/${postId}`,
              query,
              doCreateNewWindow,
              searchQueryText: queryText,
            })
            break
          }

          case 'channel': {
            const { channelId, subPath, url } = result

            openInternalPath({
              path: `/channel/${channelId}/${subPath}`,
              doCreateNewWindow,
              query: {
                url,
              },
              searchQueryText: queryText,
            })
            break
          }

          case 'invalid_url':
          default: {
            openInternalPath({
              path: `/search/${encodeURIComponent(queryText)}`,
              query: {
                sortBy: this.searchSettings.sortBy,
                time: this.searchSettings.time,
                type: this.searchSettings.type,
                duration: this.searchSettings.duration,
                features: this.searchSettings.features,
              },
              doCreateNewWindow,
              searchQueryText: queryText,
            })
          }
        }

        if (doCreateNewWindow) {
          // Query text copied to new window = can be removed from current window
          this.updateSearchInputText('')
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

    getNavigationHistoryResultEndIndex: function (navigationHistoryActiveIndex, navigationHistoryLength) {
      if (navigationHistoryActiveIndex < HALF_OF_NAV_HISTORY_DISPLAY_LIMIT) {
        return Math.min(navigationHistoryLength - 1, NAV_HISTORY_DISPLAY_LIMIT - 1)
      } else if (navigationHistoryLength - navigationHistoryActiveIndex < HALF_OF_NAV_HISTORY_DISPLAY_LIMIT + 1) {
        return navigationHistoryLength - 1
      } else {
        return navigationHistoryActiveIndex + HALF_OF_NAV_HISTORY_DISPLAY_LIMIT
      }
    },

    getNavigationHistoryDropdownOptions: async function (ipcRenderer, navigationHistoryActiveIndex, navigationHistoryLength) {
      const dropdownOptions = []
      const end = this.getNavigationHistoryResultEndIndex(navigationHistoryActiveIndex, navigationHistoryLength)

      for (let index = end; index >= Math.max(0, end + 1 - NAV_HISTORY_DISPLAY_LIMIT); --index) {
        const routeLabel = await ipcRenderer.invoke(IpcChannels.GET_NAV_HISTORY_ENTRY_TITLE_AT_INDEX, index)
        const isActiveIndex = index === navigationHistoryActiveIndex
        const dropdownOption = {
          label: routeLabel,
          value: index - navigationHistoryActiveIndex,
          active: isActiveIndex
        }

        dropdownOptions.push(dropdownOption)

        if (isActiveIndex) {
          this.navigationHistoryDropdownActiveEntry = dropdownOption
        }
      }
      return dropdownOptions
    },

    setNavigationHistoryDropdownOptions: async function() {
      if (process.env.IS_ELECTRON) {
        const { ipcRenderer } = require('electron')
        const navigationHistoryLength = await ipcRenderer.invoke(IpcChannels.GET_NAV_HISTORY_LENGTH)
        const navigationHistoryActiveIndex = await ipcRenderer.invoke(IpcChannels.GET_NAV_HISTORY_ACTIVE_INDEX)

        this.navigationHistoryDropdownOptions = await this.getNavigationHistoryDropdownOptions(ipcRenderer, navigationHistoryActiveIndex, navigationHistoryLength)
      }
    },

    goToOffset: function (offset) {
      if (process.env.IS_ELECTRON) {
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.GO_TO_NAV_HISTORY_OFFSET, offset)
      }
    },

    historyBack: function (offset) {
      if (offset != null) {
        this.goToOffset(offset)
      } else {
        this.$router.back()
      }
    },

    historyForward: function (offset) {
      if (offset != null) {
        this.goToOffset(offset)
      } else {
        this.$router.forward()
      }
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
    setActiveNavigationHistoryEntryTitle(value) {
      this.$nextTick(() => {
        if (this.navigationHistoryDropdownActiveEntry?.label) {
          this.navigationHistoryDropdownActiveEntry.label = value
        }
      })
    },

    ...mapActions([
      'getYoutubeUrlInfo',
      'showSearchFilters'
    ])
  }
})
