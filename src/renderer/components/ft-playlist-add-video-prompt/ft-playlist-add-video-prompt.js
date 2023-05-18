import Vue from 'vue'
import { mapActions } from 'vuex'
import debounce from 'lodash.debounce'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtPlaylistSelector from '../ft-playlist-selector/ft-playlist-selector.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import {
  showToast,
} from '../../helpers/utils'

export default Vue.extend({
  name: 'FtPlaylistAddVideoPrompt',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt,
    'ft-button': FtButton,
    'ft-playlist-selector': FtPlaylistSelector,
    'ft-input': FtInput,
  },
  data: function () {
    return {
      playlistAddVideoPromptValues: [
        'save',
        'cancel'
      ],
      selectedPlaylists: [],
      query: '',
      updateQueryDebounce: function() {},
    }
  },
  computed: {
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
    selectedPlaylistsCount: function () {
      return this.selectedPlaylists.length
    },
    showAddToPlaylistPrompt: function () {
      return this.$store.getters.getShowAddToPlaylistPrompt
    },
    playlistAddVideoObject: function () {
      return this.$store.getters.getPlaylistAddVideoObject
    },
    playlistAddVideoPromptNames: function () {
      return [
        'Save',
        'Cancel'
      ]
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
  },
  mounted: function () {
    // this.parseUserData()
    this.updateQueryDebounce = debounce(this.updateQuery, 500)
  },
  methods: {
    handleAddToPlaylistPrompt: function (option) {
      this.hideAddToPlaylistPrompt()
    },

    countSelected: function (index) {
      const indexOfVideo = this.selectedPlaylists.indexOf(index)
      if (indexOfVideo !== -1) {
        this.selectedPlaylists.splice(indexOfVideo, 1)
      } else {
        this.selectedPlaylists.push(index)
      }
    },

    addSelectedToPlaylists: function () {
      let addedPlaylists = 0
      this.selectedPlaylists.forEach((index) => {
        const playlist = this.allPlaylists[index]
        const videoId = this.playlistAddVideoObject.videoId
        const findVideo = playlist.videos.findIndex((video) => {
          return video.videoId === videoId
        })
        if (findVideo === -1) {
          const payload = {
            _id: playlist._id,
            videoData: this.playlistAddVideoObject,
          }
          this.addVideo(payload)
          addedPlaylists++
        }
      })

      showToast(`Video has been added to ${addedPlaylists} playlist(s).`)
      this.handleAddToPlaylistPrompt(null)
    },

    createNewPlaylist: function () {
      this.showCreatePlaylistPrompt({
        title: '',
        videos: []
      })
    },

    updateQuery: function(query) {
      this.query = query
    },

    ...mapActions([
      'addVideo',
      'hideAddToPlaylistPrompt',
      'showCreatePlaylistPrompt',
    ])
  }
})
