import Vue from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtPlaylistSelector from '../ft-playlist-selector/ft-playlist-selector.vue'

export default Vue.extend({
  name: 'FtPlaylistAddVideoPrompt',
  components: {
    FtFlexBox,
    FtPrompt,
    FtButton,
    FtPlaylistSelector
  },
  data: function () {
    return {
      playlistAddVideoPromptValues: [
        'save',
        'cancel'
      ],
      selectedPlaylists: []
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
    }
  },
  mounted: function () {
    // this.parseUserData()
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
            videoData: this.playlistAddVideoObject
          }
          this.addVideo(payload)
          addedPlaylists++
        }
      })

      this.showToast({
        message: `Video has been added to ${addedPlaylists} playlist(s).`
      })
      this.handleAddToPlaylistPrompt(null)
    },

    createNewPlaylist: function () {
      this.showCreatePlaylistPrompt({
        title: '',
        videos: []
      })
    },

    ...mapActions([
      'showToast',
      'addVideo',
      'hideAddToPlaylistPrompt',
      'showCreatePlaylistPrompt'
    ])
  }
})
