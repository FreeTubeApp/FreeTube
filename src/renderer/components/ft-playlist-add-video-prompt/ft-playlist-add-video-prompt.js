import Vue from 'vue'
import { mapActions } from 'vuex'
import debounce from 'lodash.debounce'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtPlaylistSelector from '../ft-playlist-selector/ft-playlist-selector.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
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
const SORT_BY_NAMES = {
  NameAscending: 'A-Z',
  NameDescending: 'Z-A',

  LatestCreatedFirst: 'Recently Created',
  EarliestCreatedFirst: 'Earliest Created',

  LatestUpdatedFirst: 'Recently Updated',
  EarliestUpdatedFirst: 'Earliest Updated',
}

export default Vue.extend({
  name: 'FtPlaylistAddVideoPrompt',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton,
    'ft-playlist-selector': FtPlaylistSelector,
    'ft-input': FtInput,
    'ft-select': FtSelect,
  },
  data: function () {
    return {
      selectedPlaylistIdList: [],
      createdSincePromptShownPlaylistIdList: [],
      query: '',
      updateQueryDebounce: function() {},
      lastShownAt: Date.now(),
      lastActiveElement: null,
      interactionsLocked: false,
      preventOpenCreatePlaylistPromptOnce: false,
      sortBy: SORT_BY_VALUES.LatestUpdatedFirst,
    }
  },
  computed: {
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

        return playlist.playlistName.toLowerCase().includes(this.processedQuery)
      }).sort((a, b) => {
        // Latest updated first
        return b.lastUpdatedAt - a.lastUpdatedAt
      })
    },

    createPlaylistPromptShown: function () {
      return this.$store.getters.getShowCreatePlaylistPrompt
    },

    tabindex() {
      return this.interactionsLocked ? -1 : 0
    },

    sortBySelectNames() {
      return Object.keys(SORT_BY_VALUES).map(k => SORT_BY_NAMES[k])
    },
    sortBySelectValues() {
      return Object.values(SORT_BY_VALUES)
    },
  },
  watch: {
    allPlaylistsLength(val, oldVal) {
      // When playlist length changed, a playlist removed or added
      // Only cares about playlist added
      if (val < oldVal) { return }

      this.allPlaylists.forEach((playlist) => {
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

      // Focus back to search input
      // Allow search and easier deselecting new created playlist
      this.$refs.searchBar.focus()
    },

    createPlaylistPromptShown(value) {
      // Lock interactions when create playlist prompt opened
      this.interactionsLocked = value

      if (!value) {
        // create playlist prompt closing
        // Solution/Workaround for strange click event
        this.preventOpenCreatePlaylistPromptOnce = true
      }
    },
  },
  mounted: function () {
    this.lastActiveElement = document.activeElement

    this.updateQueryDebounce = debounce(this.updateQuery, 500)
    // User might want to search first if they have many playlists
    this.$refs.searchBar.focus()
  },
  destroyed() {
    if (this.lastActiveElement != null) {
      this.lastActiveElement.focus()
    }
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
        showToast('You haven\'t selected any playlist yet.')
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

      showToast(`${this.toBeAddedToPlaylistVideoCount} video(s) added to ${addedPlaylistIds.size} playlist(s).`)
      this.hide()
    },

    openCreatePlaylistPrompt: function () {
      // Solution/Workaround for strange click event
      // Prevents prompt from reopening right after close
      if (this.preventOpenCreatePlaylistPromptOnce) {
        this.preventOpenCreatePlaylistPromptOnce = false
        return
      }

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
