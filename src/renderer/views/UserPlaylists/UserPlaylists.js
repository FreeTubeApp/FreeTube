import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import debounce from 'lodash.debounce'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtTooltip from '../../components/ft-tooltip/ft-tooltip.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtToggleSwitch from '../../components/ft-toggle-switch/ft-toggle-switch.vue'
import FtAutoLoadNextPageWrapper from '../../components/ft-auto-load-next-page-wrapper/ft-auto-load-next-page-wrapper.vue'
import { ctrlFHandler, getIconForSortPreference } from '../../helpers/utils'

const SORT_BY_VALUES = {
  NameAscending: 'name_ascending',
  NameDescending: 'name_descending',

  LatestCreatedFirst: 'latest_created_first',
  EarliestCreatedFirst: 'earliest_created_first',

  LatestUpdatedFirst: 'latest_updated_first',
  EarliestUpdatedFirst: 'earliest_updated_first',

  LatestPlayedFirst: 'latest_played_first',
  EarliestPlayedFirst: 'earliest_played_first',
}

export default defineComponent({
  name: 'UserPlaylists',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-tooltip': FtTooltip,
    'ft-loader': FtLoader,
    'ft-button': FtButton,
    'ft-select': FtSelect,
    'ft-element-list': FtElementList,
    'ft-icon-button': FtIconButton,
    'ft-input': FtInput,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-auto-load-next-page-wrapper': FtAutoLoadNextPageWrapper,
  },
  data: function () {
    return {
      isLoading: false,
      dataLimit: 100,
      searchDataLimit: 100,
      showLoadMoreButton: false,
      query: '',
      doSearchPlaylistsWithMatchingVideos: false,
      activeData: [],
      sortBy: SORT_BY_VALUES.LatestPlayedFirst,
    }
  },
  computed: {
    locale: function () {
      return this.$i18n.locale.replace('_', '-')
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
          case SORT_BY_VALUES.LatestPlayedFirst: {
            if (a.lastPlayedAt == null && b.lastPlayedAt == null) {
              return a.playlistName.localeCompare(b.playlistName, this.locale)
            }
            // Never played playlist = move to last
            if (a.lastPlayedAt == null) { return 1 }
            if (b.lastPlayedAt == null) { return -1 }
            if (a.lastPlayedAt > b.lastPlayedAt) { return -1 }
            if (a.lastPlayedAt < b.lastPlayedAt) { return 1 }

            return a.playlistName.localeCompare(b.playlistName, this.locale)
          }
          case SORT_BY_VALUES.EarliestPlayedFirst: {
            // Never played playlist = first
            if (a.lastPlayedAt == null && b.lastPlayedAt == null) {
              return a.playlistName.localeCompare(b.playlistName, this.locale)
            }
            // Never played playlist = move to first
            if (a.lastPlayedAt == null) { return -1 }
            if (b.lastPlayedAt == null) { return 1 }
            if (a.lastPlayedAt < b.lastPlayedAt) { return -1 }
            if (a.lastPlayedAt > b.lastPlayedAt) { return 1 }

            return a.playlistName.localeCompare(b.playlistName, this.locale)
          }
          default:
            console.error(`Unknown sortBy: ${this.sortBy}`)
            return 0
        }
      })
    },

    fullData: function () {
      const data = this.allPlaylists
      if (this.allPlaylists.length < this.dataLimit) {
        return data
      } else {
        return data.slice(0, this.dataLimit)
      }
    },

    lowerCaseQuery: function() {
      return this.query.toLowerCase()
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
          case SORT_BY_VALUES.LatestPlayedFirst:
            return this.$t('User Playlists.Sort By.LatestPlayedFirst')
          case SORT_BY_VALUES.EarliestPlayedFirst:
            return this.$t('User Playlists.Sort By.EarliestPlayedFirst')
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
    lowerCaseQuery() {
      this.searchDataLimit = 100
      this.filterPlaylistAsync()
    },
    doSearchPlaylistsWithMatchingVideos() {
      this.searchDataLimit = 100
      this.filterPlaylistAsync()
    },
    fullData() {
      this.activeData = this.fullData
      this.filterPlaylist()
    },
    sortBy() {
      sessionStorage.setItem('UserPlaylists/sortBy', this.sortBy)
    },
  },
  mounted: function () {
    document.addEventListener('keydown', this.keyboardShortcutHandler)
    const limit = sessionStorage.getItem('favoritesLimit')
    if (limit !== null) {
      this.dataLimit = limit
    }

    const sortBy = sessionStorage.getItem('UserPlaylists/sortBy')
    if (sortBy != null) {
      this.sortBy = sortBy
    }

    this.activeData = this.fullData

    this.showLoadMoreButton = this.activeData.length < this.allPlaylists.length

    this.filterPlaylistDebounce = debounce(this.filterPlaylist, 500)
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
  },
  methods: {
    increaseLimit: function () {
      if (this.query !== '') {
        this.searchDataLimit += 100
        this.filterPlaylist()
      } else {
        this.dataLimit += 100
        sessionStorage.setItem('favoritesLimit', this.dataLimit)
      }
    },
    filterPlaylistAsync: function() {
      // Updating list on every char input could be wasting resources on rendering
      // So run it with delay (to be cancelled when more input received within time)
      this.filterPlaylistDebounce()
    },
    filterPlaylist: function() {
      if (this.lowerCaseQuery === '') {
        this.activeData = this.fullData
        this.showLoadMoreButton = this.allPlaylists.length > this.activeData.length
        return
      }

      const filteredPlaylists = this.allPlaylists.filter((playlist) => {
        if (typeof (playlist.playlistName) !== 'string') { return false }

        if (this.doSearchPlaylistsWithMatchingVideos) {
          if (playlist.videos.some((v) => v.author.toLowerCase().includes(this.lowerCaseQuery) || v.title.toLowerCase().includes(this.lowerCaseQuery))) {
            return true
          }
        }

        return playlist.playlistName.toLowerCase().includes(this.lowerCaseQuery)
      })
      this.showLoadMoreButton = filteredPlaylists.length > this.searchDataLimit
      this.activeData = filteredPlaylists.length < this.searchDataLimit ? filteredPlaylists : filteredPlaylists.slice(0, this.searchDataLimit)
    },

    createNewPlaylist: function () {
      this.showCreatePlaylistPrompt({
        title: '',
      })
    },

    keyboardShortcutHandler: function (event) {
      ctrlFHandler(event, this.$refs.searchBar)
    },

    getIconForSortPreference: (s) => getIconForSortPreference(s),

    ...mapActions([
      'showCreatePlaylistPrompt'
    ])
  }
})
