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
      return this.$store.getters.getAllPlaylists
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
      console.log(option)
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
      this.handleAddToPlaylistPrompt(null)
    },

    ...mapActions([
      'showToast',
      'addVideo',
      'hideAddToPlaylistPrompt'
    ])
  }
})
