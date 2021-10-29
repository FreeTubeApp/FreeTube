import Vue from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtPlaylistSelector from '../ft-playlist-selector/ft-playlist-selector.vue'

export default Vue.extend({
  name: 'FtCreatePlaylistPrompt',
  components: {
    FtFlexBox,
    FtPrompt,
    FtButton,
    FtInput,
    FtPlaylistSelector
  },
  data: function () {
    return {
      playlistName: '',
      playlistAddVideoPromptValues: [
        'save',
        'cancel'
      ],
      selectedPlaylists: []
    }
  },
  computed: {
    allPlaylists: function () {
      return this.$store.getters.getAllPlaylists
    },
    newPlaylistVideoObject: function () {
      return this.$store.getters.getNewPlaylistVideoObject
    },
    videoImportLength: function () {
      return this.newPlaylistVideoObject.videos.length
    }
  },
  mounted: function () {
    this.playlistName = this.newPlaylistVideoObject.title
  },
  methods: {
    handleCreatePlaylistPrompt: function (option) {
      this.hideCreatePlaylistPrompt()
    },

    createNewPlaylist: function () {
      const videosObject = this.videoImportLength > 0 ? this.newPlaylistVideoObject.videos : []

      const playlistObject = {
        playlistName: this.playlistName,
        protected: false,
        removeOnWatched: false,
        description: '',
        videos: videosObject
      }

      const nameExists = this.allPlaylists.findIndex((playlist) => {
        return playlist.playlistName.toLowerCase() === this.playlistName.toLowerCase()
      })

      if (this.playlistName === '') {
        this.showToast({
          message: 'Playlist name cannot be empty. Please input a name.'
        })
      } else if (nameExists !== -1) {
        this.showToast({
          message: 'There is already a playlist with this name. Please pick a different name.'
        })
      } else {
        try {
          this.addPlaylist(playlistObject)
          this.showToast({
            message: `Playlist ${this.playlistName} has been successfully created.`
          })
        } catch (e) {
          this.showToast({
            message: 'There was an issue with creating the playlist.'
          })
          console.error(e)
        } finally {
          this.hideCreatePlaylistPrompt()
        }
      }
    },

    ...mapActions([
      'showToast',
      'addPlaylist',
      'hideCreatePlaylistPrompt'
    ])
  }
})
