import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtTooltip from '../../components/ft-tooltip/ft-tooltip.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

export default Vue.extend({
  name: 'UserPlaylists',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-tooltip': FtTooltip,
    'ft-loader': FtLoader,
    'ft-button': FtButton,
    'ft-icon-button': FtIconButton,
    'ft-element-list': FtElementList
  },
  data: function () {
    return {
      isLoading: false,
      dataLimit: 100
    }
  },
  computed: {
    allPlaylists: function () {
      const playlists = this.$store.getters.getAllPlaylists
      const formattedPlaylists = [].concat(playlists).map((playlist) => {
        playlist.title = playlist.playlistName
        playlist.type = 'playlist'
        playlist.thumbnail = ''
        playlist.channelName = ''
        playlist.channelLink = ''
        playlist.playlistLink = ''
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
        } else if (a.title > b.title) {
          return 1
        } else if (a.title < b.title) {
          return -1
        }

        return 0
      })
      return formattedPlaylists
    },

    activeData: function () {
      const data = this.allPlaylists
      if (this.allPlaylists.length < this.dataLimit) {
        return data
      } else {
        return data.slice(0, this.dataLimit)
      }
    }
  },
  watch: {
    activeData() {
      this.isLoading = true
      setTimeout(() => {
        this.isLoading = false
      }, 100)
    }
  },
  mounted: function () {
    const limit = sessionStorage.getItem('favoritesLimit')
    if (limit !== null) {
      this.dataLimit = limit
    }
  },
  methods: {
    increaseLimit: function () {
      this.dataLimit += 100
      sessionStorage.setItem('favoritesLimit', this.dataLimit)
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
