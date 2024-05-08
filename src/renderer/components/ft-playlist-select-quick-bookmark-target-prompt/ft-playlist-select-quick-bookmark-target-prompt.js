import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import debounce from 'lodash.debounce'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtPlaylistSelector from '../ft-playlist-selector/ft-playlist-selector.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
import FtToggleSwitch from '../../components/ft-toggle-switch/ft-toggle-switch.vue'
import {
  ctrlFHandler,
  getIconForSortPreference
} from '../../helpers/utils'

const SORT_BY_VALUES = {
  NameAscending: 'name_ascending',
  NameDescending: 'name_descending',

  LatestCreatedFirst: 'latest_created_first',
  EarliestCreatedFirst: 'earliest_created_first',

  LatestUpdatedFirst: 'latest_updated_first',
  EarliestUpdatedFirst: 'earliest_updated_first',
}

export default defineComponent({
  name: 'FtPlaylistSelectQuickBookmarkTargetPrompt',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton,
    'ft-playlist-selector': FtPlaylistSelector,
    'ft-input': FtInput,
    'ft-select': FtSelect,
    'ft-toggle-switch': FtToggleSwitch,
  },
  data: function () {
    return {
      query: '',
      doSearchPlaylistsWithMatchingVideos: false,
      updateQueryDebounce: function() {},
      lastShownAt: Date.now(),
      sortBy: SORT_BY_VALUES.LatestUpdatedFirst,
    }
  },
  computed: {
    title: function () {
      return this.$t('User Playlists.SelectQuickBookmarkTargetPrompt.Select a playlist as quick bookmark target')
    },

    showingCreatePlaylistPrompt: function () {
      return this.$store.getters.getShowCreatePlaylistPrompt
    },

    allPlaylists: function () {
      const playlists = this.$store.getters.getAllPlaylists
      return [].concat(playlists).sort((a, b) => {
        switch (this.sortBy) {
          case SORT_BY_VALUES.NameAscending:
            return a.playlistName.localeCompare(b.playlistName, this.locale)
          case SORT_BY_VALUES.NameDescending:
            return b.playlistName.localeCompare(a.playlistName, this.locale)
          case SORT_BY_VALUES.LatestCreatedFirst: {
            if (a.createdAt > b.createdAt) { return -1 }
            if (a.createdAt < b.createdAt) { return 1 }

            return a.playlistName.localeCompare(b.playlistName, this.locale)
          }
          case SORT_BY_VALUES.EarliestCreatedFirst: {
            if (a.createdAt < b.createdAt) { return -1 }
            if (a.createdAt > b.createdAt) { return 1 }

            return a.playlistName.localeCompare(b.playlistName, this.locale)
          }
          case SORT_BY_VALUES.LatestUpdatedFirst: {
            if (a.lastUpdatedAt > b.lastUpdatedAt) { return -1 }
            if (a.lastUpdatedAt < b.lastUpdatedAt) { return 1 }

            return a.playlistName.localeCompare(b.playlistName, this.locale)
          }
          case SORT_BY_VALUES.EarliestUpdatedFirst: {
            if (a.lastUpdatedAt < b.lastUpdatedAt) { return -1 }
            if (a.lastUpdatedAt > b.lastUpdatedAt) { return 1 }

            return a.playlistName.localeCompare(b.playlistName, this.locale)
          }
          default:
            console.error(`Unknown sortBy: ${this.sortBy}`)
            return 0
        }
      })
    },
    allPlaylistsLength() {
      return this.allPlaylists.length
    },
    toBeAddedToPlaylistVideoCount: function () {
      return this.toBeAddedToPlaylistVideoList.length
    },
    showAddToPlaylistPrompt: function () {
      return this.$store.getters.getShowAddToPlaylistPrompt
    },
    toBeAddedToPlaylistVideoList: function () {
      return this.$store.getters.getToBeAddedToPlaylistVideoList
    },
    newPlaylistDefaultProperties: function () {
      return this.$store.getters.getNewPlaylistDefaultProperties
    },
    locale: function () {
      return this.$i18n.locale.replace('_', '-')
    },
    processedQuery: function() {
      return this.query.trim().toLowerCase()
    },
    activePlaylists: function() {
      // Very rare that a playlist name only has 1 char
      if (this.processedQuery.length === 0) { return this.allPlaylists }

      return this.allPlaylists.filter((playlist) => {
        if (typeof (playlist.playlistName) !== 'string') { return false }

        if (this.doSearchPlaylistsWithMatchingVideos) {
          if (playlist.videos.some((v) => v.author.toLowerCase().includes(this.processedQuery) || v.title.toLowerCase().includes(this.processedQuery))) {
            return true
          }
        }

        return playlist.playlistName.toLowerCase().includes(this.processedQuery)
      })
    },

    sortBySelectNames() {
      return Object.values(SORT_BY_VALUES).map((k) => {
        switch (k) {
          case SORT_BY_VALUES.NameAscending:
            return this.$t('User Playlists.Sort By.NameAscending')
          case SORT_BY_VALUES.NameDescending:
            return this.$t('User Playlists.Sort By.NameDescending')
          case SORT_BY_VALUES.LatestCreatedFirst:
            return this.$t('User Playlists.Sort By.LatestCreatedFirst')
          case SORT_BY_VALUES.EarliestCreatedFirst:
            return this.$t('User Playlists.Sort By.EarliestCreatedFirst')
          case SORT_BY_VALUES.LatestUpdatedFirst:
            return this.$t('User Playlists.Sort By.LatestUpdatedFirst')
          case SORT_BY_VALUES.EarliestUpdatedFirst:
            return this.$t('User Playlists.Sort By.EarliestUpdatedFirst')
          default:
            console.error(`Unknown sortBy: ${k}`)
            return k
        }
      })
    },
    sortBySelectValues() {
      return Object.values(SORT_BY_VALUES)
    },
  },
  watch: {
    allPlaylistsLength(val, oldVal) {
      if (val > oldVal) {
        // Focus back to search input only when playlist added
        // Allow search and easier deselecting new created playlist
        nextTick(() => this.$refs.searchBar.focus())
      }
    },

    showingCreatePlaylistPrompt(val) {
      if (val) { return }

      // Only care when CreatePlaylistPrompt hidden
      // Shift focus from button to prevent unwanted click event
      // due to enter key press in CreatePlaylistPrompt
      nextTick(() => this.$refs.searchBar.focus())
    },
  },
  mounted: function () {
    this.updateQueryDebounce = debounce(this.updateQuery, 500)
    document.addEventListener('keydown', this.keyboardShortcutHandler)
    // User might want to search first if they have many playlists
    nextTick(() => this.$refs.searchBar.focus())
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
  },
  methods: {
    hide: function () {
      this.hideSelectQuickBookmarkTargetPrompt()
    },

    openCreatePlaylistPrompt: function () {
      this.showCreatePlaylistPrompt({
        title: this.newPlaylistDefaultProperties.title || '',
      })
    },

    updateQuery: function(query) {
      this.query = query
    },

    keyboardShortcutHandler: function (event) {
      ctrlFHandler(event, this.$refs.searchBar)
    },

    getIconForSortPreference: (s) => getIconForSortPreference(s),

    async handlePlaylistSelected (playlistId) {
      // Hide AFTER quick bookmark target saved
      // Prompt close callbacks rely on that state being actually updated
      await this.updateQuickBookmarkTargetPlaylistId(playlistId)
      this.hide()
    },

    ...mapActions([
      'hideSelectQuickBookmarkTargetPrompt',
      'showCreatePlaylistPrompt',

      'updateQuickBookmarkTargetPlaylistId',
    ])
  }
})
