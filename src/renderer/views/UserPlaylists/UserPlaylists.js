import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import debounce from 'lodash.debounce'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtTooltip from '../../components/ft-tooltip/ft-tooltip.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'

export default defineComponent({
  name: 'UserPlaylists',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-tooltip': FtTooltip,
    'ft-loader': FtLoader,
    'ft-button': FtButton,
    'ft-element-list': FtElementList,
    'ft-icon-button': FtIconButton,
    'ft-input': FtInput,
  },
  data: function () {
    return {
      isLoading: false,
      dataLimit: 100,
      searchDataLimit: 100,
      showLoadMoreButton: false,
      query: '',
      activeData: [],
    }
  },
  computed: {
    locale: function () {
      return this.$i18n.locale.replace('_', '-')
    },

    favoritesPlaylist: function () {
      return this.$store.getters.getFavorites
    },

    allPlaylists: function () {
      const playlists = this.$store.getters.getAllPlaylists
      return [].concat(playlists).map((playlist) => {
        playlist.title = playlist.playlistName
        playlist.type = 'playlist'
        playlist.thumbnail = ''
        playlist.channelName = ''
        playlist.channelId = ''
        playlist.playlistId = ''
        playlist.videoCount = playlist.videos.length
        return playlist
      }).sort((a, b) => {
        // Sort by favorites, watch later, then alphabetically
        if (a._id === 'favorites') {
          return -1
        } else if (b._id === 'favorites') {
          return 1
        } else if (a._id === 'watchLater') {
          return -1
        } else if (b._id === 'watchLater') {
          return 1
        }

        return a.title.localeCompare(b.title, this.locale)
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
  },
  watch: {
    lowerCaseQuery() {
      this.searchDataLimit = 100
      this.filterPlaylistAsync()
    },
    fullData() {
      this.activeData = this.fullData
      this.filterPlaylist()
    },
  },
  mounted: function () {
    const limit = sessionStorage.getItem('favoritesLimit')

    if (limit !== null) {
      this.dataLimit = limit
    }

    this.activeData = this.fullData

    this.showLoadMoreButton = this.activeData.length < this.allPlaylists.length

    this.filterPlaylistDebounce = debounce(this.filterPlaylist, 500)
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
      } else {
        const filteredPlaylists = this.allPlaylists.filter((playlist) => {
          if (typeof (playlist.playlistName) !== 'string') { return false }

          return playlist.playlistName.toLowerCase().includes(this.lowerCaseQuery)
        }).sort((a, b) => {
          // Latest updated first
          return b.lastUpdatedAt - a.lastUpdatedAt
        })
        this.showLoadMoreButton = filteredPlaylists.length > this.searchDataLimit
        this.activeData = filteredPlaylists.length < this.searchDataLimit ? filteredPlaylists : filteredPlaylists.slice(0, this.searchDataLimit)
      }
    },

    createNewPlaylist: function () {
      this.showCreatePlaylistPrompt({
        title: '',
        videos: []
      })
    },

    ...mapActions([
      'showCreatePlaylistPrompt'
    ])
  }
})
