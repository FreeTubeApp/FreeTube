import { defineComponent } from 'vue'
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
  showToast,
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
  name: 'FtPlaylistAddVideoPrompt',
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
      selectedPlaylistIdList: [],
      createdSincePromptShownPlaylistIdList: [],
      query: '',
      doSearchPlaylistsWithMatchingVideos: false,
      updateQueryDebounce: function() {},
      lastShownAt: Date.now(),
      lastActiveElement: null,
      sortBy: SORT_BY_VALUES.LatestUpdatedFirst,
    }
  },
  computed: {
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
    selectedPlaylistCount: function () {
      return this.selectedPlaylistIdList.length
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

    processedQuery: function() {
      return this.query.trim().toLowerCase()
    },
    activePlaylists: function() {
      // Very rare that a playlist name only has 1 char
      if (this.processedQuery.length === 0) { return this.allPlaylists }

      return this.allPlaylists.filter((playlist) => {
        if (typeof (playlist.playlistName) !== 'string') { return false }

        if (this.doSearchPlaylistsWithMatchingVideos) {
          if (playlist.videos.some((v) => v.title.toLowerCase().includes(this.processedQuery))) {
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
      const allPlaylistIds = []

      // Add new playlists to selected
      this.allPlaylists.forEach((playlist) => {
        allPlaylistIds.push(playlist._id)

        // Old playlists don't have `createdAt`
        if (playlist.createdAt == null) { return }
        // Only playlists created after this prompt shown should be considered
        if (playlist.createdAt < this.lastShownAt) { return }
        // Only playlists not auto added to selected yet should be considered
        if (this.createdSincePromptShownPlaylistIdList.includes(playlist._id)) { return }

        // Add newly created playlists to selected ONCE
        this.createdSincePromptShownPlaylistIdList.push(playlist._id)
        this.selectedPlaylistIdList.push(playlist._id)
      })

      // Remove  deleted playlist from deleted
      this.selectedPlaylistIdList = this.selectedPlaylistIdList.filter(playlistId => {
        return allPlaylistIds.includes(playlistId)
      })

      if (val > oldVal) {
        // Focus back to search input only when playlist added
        // Allow search and easier deselecting new created playlist
        this.$refs.searchBar.focus()
      }
    },

    showingCreatePlaylistPrompt(val) {
      if (val) { return }

      // Only care when CreatePlaylistPrompt hidden
      // Shift focus from button to prevent unwanted click event
      // due to enter key press in CreatePlaylistPrompt
      this.$refs.searchBar.focus()
    },
  },
  mounted: function () {
    this.lastActiveElement = document.activeElement

    this.updateQueryDebounce = debounce(this.updateQuery, 500)
    // User might want to search first if they have many playlists
    this.$refs.searchBar.focus()
  },
  beforeDestroy() {
    this.lastActiveElement?.focus()
  },
  methods: {
    hide: function () {
      this.hideAddToPlaylistPrompt()
    },

    countSelected: function (playlistId) {
      const index = this.selectedPlaylistIdList.indexOf(playlistId)
      if (index !== -1) {
        this.selectedPlaylistIdList.splice(index, 1)
      } else {
        this.selectedPlaylistIdList.push(playlistId)
      }
    },

    addSelectedToPlaylists: function () {
      const addedPlaylistIds = new Set()

      if (this.selectedPlaylistIdList.length === 0) {
        showToast(this.$t('User Playlists.AddVideoPrompt.Toast["You haven\'t selected any playlist yet."]'))
        return
      }

      this.selectedPlaylistIdList.forEach((selectedPlaylistId) => {
        const playlist = this.allPlaylists.find((list) => list._id === selectedPlaylistId)
        if (playlist == null) { return }

        this.addVideos({
          _id: playlist._id,
          // Use [].concat to avoid `do not mutate vuex store state outside mutation handlers`
          videos: [].concat(this.toBeAddedToPlaylistVideoList),
        })
        addedPlaylistIds.add(playlist._id)
        // Update playlist's `lastUpdatedAt`
        this.updatePlaylist({ _id: playlist._id })
      })

      const translationEntryKey = addedPlaylistIds.size === 1
        ? 'User Playlists.AddVideoPrompt.Toast.{videoCount} video(s) added to 1 playlist'
        : 'User Playlists.AddVideoPrompt.Toast.{videoCount} video(s) added to {playlistCount} playlists'
      showToast(this.$tc(translationEntryKey, this.toBeAddedToPlaylistVideoCount, {
        videoCount: this.toBeAddedToPlaylistVideoCount,
        playlistCount: addedPlaylistIds.size,
      }))
      this.hide()
    },

    openCreatePlaylistPrompt: function () {
      this.showCreatePlaylistPrompt({
        title: this.newPlaylistDefaultProperties.title || '',
      })
    },

    updateQuery: function(query) {
      this.query = query
    },

    ...mapActions([
      'addVideos',
      'updatePlaylist',
      'hideAddToPlaylistPrompt',
      'showCreatePlaylistPrompt',
    ])
  }
})
