import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtSearchFilters from '../ft-search-filters/ft-search-filters.vue'
import FtProfileSelector from '../ft-profile-selector/ft-profile-selector.vue'
import debounce from 'lodash.debounce'

import { IpcChannels } from '../../../constants'
import {
  openInternalPath,
  getVideoDropdownOptions,
  handleVideoDropdownOptionsClick
} from '../../helpers/utils'
import { clearLocalSearchSuggestionsSession, getLocalSearchSuggestions } from '../../helpers/api/local'
import { invidiousAPICall } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'TopNav',
  components: {
    FtInput,
    FtSearchFilters,
    FtProfileSelector,
    'ft-icon-button': FtIconButton
  },
  data: () => {
    return {
      component: this,
      showSearchContainer: true,
      showFilters: false,
      searchFilterValueChanged: false,
      historyIndex: 1,
      isForwardOrBack: false,
      isArrowBackwardDisabled: true,
      isArrowForwardDisabled: true,
      searchSuggestionsDataList: [],
      lastSuggestionQuery: '',
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
          page: this.$t(this.$router.getRoutes()
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

    forwardText: function () {
      return this.$t('Forward')
    },

    backwardText: function () {
      return this.$t('Back')
    },

    newWindowText: function () {
      return this.$t('Open New Window')
    },

    selectVideosText: function () {
      return this.isSelectionModeEnabled
        ? this.$t('Disable Video Selection Mode')
        : this.$t('Enable Video Selection Mode')
    },

    hideSharingActions: function() {
      return this.$store.getters.getHideSharingActions
    },

    isSelectionModeEnabled: function () {
      return this.$store.getters.getIsSelectionModeEnabled
    },

    selectionModeSelections: function () {
      return this.$store.getters.getSelectionModeSelections
    },

    selectionModeSelectionValues: function() {
      return Object.values(this.selectionModeSelections.selections)
    },

    videoDropdownOptionArguments: function() {
      const videoComponents = this.selectionModeSelectionValues
      const count = videoComponents.length
      const videosWithChannelIdsCount = videoComponents.filter((videoComponent) => videoComponent.channelId !== null).length

      const watchedVideosCount = videoComponents.filter((videoComponent) => videoComponent.watched).length
      const unwatchedVideosCount = count - watchedVideosCount

      const savedVideosCount = videoComponents.filter((videoComponent) => videoComponent.inFavoritesPlaylist).length
      const unsavedVideosCount = count - savedVideosCount

      const channelsHidden = JSON.parse(this.$store.getters.getChannelsHidden).map((ch) => {
        // Legacy support
        if (typeof ch === 'string') {
          return { name: ch, preferredName: '', icon: '' }
        }
        return ch
      })

      const hiddenChannels = new Set()
      const unhiddenChannels = new Set()
      videoComponents.forEach((videoComponent) => {
        const channelIdentifier = channelsHidden.find(ch => ch.name === videoComponent.channelId)?.name ??
          channelsHidden.find(ch => ch.name === videoComponent.channelName)?.name
        if (channelIdentifier) {
          if (!hiddenChannels.has(channelIdentifier)) {
            hiddenChannels.add(channelIdentifier)
          }
        } else if (!unhiddenChannels.has(videoComponent.channelId)) {
          unhiddenChannels.add(videoComponent.channelId)
        }
      })

      return [
        count,
        watchedVideosCount,
        unwatchedVideosCount,
        savedVideosCount,
        unsavedVideosCount,
        videosWithChannelIdsCount,
        hiddenChannels,
        unhiddenChannels,
        videoComponents
      ]
    },

    dropdownOptions: function () {
      return getVideoDropdownOptions(...this.videoDropdownOptionArguments)
    }
  },

  mounted: function () {
    let previousWidth = window.innerWidth
    if (window.innerWidth <= 680) {
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
        this.showSearchContainer = window.innerWidth > 680
        previousWidth = window.innerWidth
      }
    })

    this.debounceSearchResults = debounce(this.getSearchSuggestions, 200)
  },
  methods: {
    goToSearch: async function (query, { event }) {
      const doCreateNewWindow = event && event.shiftKey

      if (window.innerWidth <= 680) {
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
                duration: this.searchSettings.duration
              },
              doCreateNewWindow,
              searchQueryText: query
            })
          }
        }
      })

      // Close the filter panel
      this.showFilters = false
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
        if (process.env.IS_ELECTRON && this.backendFallback) {
          console.error(
            'Error gettings search suggestions.  Falling back to Local API'
          )
          this.getSearchSuggestionsLocal(query)
        }
      })
    },

    toggleSearchContainer: function () {
      this.showSearchContainer = !this.showSearchContainer
      this.showFilters = false
    },

    handleSearchFilterValueChanged: function (filterValueChanged) {
      this.searchFilterValueChanged = filterValueChanged
    },

    navigateHistory: function () {
      if (!this.isForwardOrBack) {
        this.historyIndex = window.history.length
        this.isArrowBackwardDisabled = false
        this.isArrowForwardDisabled = true
      } else {
        this.isForwardOrBack = false
      }

      this.setSelectionMode(false)
    },

    historyBack: function () {
      this.isForwardOrBack = true
      window.history.back()

      if (this.historyIndex > 1) {
        this.historyIndex--
        this.isArrowForwardDisabled = false
        if (this.historyIndex === 1) {
          this.isArrowBackwardDisabled = true
        }
      }
    },

    historyForward: function () {
      this.isForwardOrBack = true
      window.history.forward()

      if (this.historyIndex < window.history.length) {
        this.historyIndex++
        this.isArrowBackwardDisabled = false

        if (this.historyIndex === window.history.length) {
          this.isArrowForwardDisabled = true
        }
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

    handleOptionsClick: function (option) {
      handleVideoDropdownOptionsClick(option, ...this.videoDropdownOptionArguments,
        (channelsHidden) => this.updateChannelsHidden(channelsHidden))
    },

    toggleSelectionMode: function () {
      this.setSelectionMode(!this.isSelectionModeEnabled)
    },

    setSelectionMode: function (value) {
      if (this.isSelectionModeEnabled === value) {
        return
      }

      // prevents all page elements from being highlighted if Ctrl+A was used in Selection Mode
      if (this.isSelectionModeEnabled && window.getSelection) {
        window.getSelection().empty()
      }

      this.$store.commit('setSelectionMode', value)

      if (!value) {
        this.clearSelectionModeSelections()
      }
    },

    navigate: function (route) {
      this.$router.push('/' + route)
    },
    hideFilters: function () {
      this.showFilters = false
    },

    updateSearchInputText: function (text) {
      this.$refs.searchInput.updateInputData(text)
    },
    ...mapActions([
      'getYoutubeUrlInfo',
      'clearSelectionModeSelections',
      'updateChannelsHidden'
    ])
  }
})
