import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtPlaylistSelector from '../ft-playlist-selector/ft-playlist-selector.vue'
import {
  showToast,
} from '../../helpers/utils'

export default defineComponent({
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
    }
  },
  computed: {
    allPlaylists: function () {
      return this.$store.getters.getAllPlaylists
    },
    newPlaylistVideoObject: function () {
      return this.$store.getters.getNewPlaylistVideoObject
    },
  },
  mounted: function () {
    this.playlistName = this.newPlaylistVideoObject.title
    // Faster to input required playlist name
    this.$refs.playlistNameInput.focus()
  },
  methods: {
    createNewPlaylist: function () {
      if (this.playlistName === '') {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["Playlist name cannot be empty. Please input a name."]'))
        return
      }

      const nameExists = this.allPlaylists.findIndex((playlist) => {
        return playlist.playlistName === this.playlistName
      })
      if (nameExists !== -1) {
        showToast(this.$t('User Playlists.CreatePlaylistPrompt.Toast["There is already a playlist with this name. Please pick a different name."]'))
        return
      }

      const playlistObject = {
        playlistName: this.playlistName,
        protected: false,
        description: '',
        videos: [],
      }

      try {
        this.addPlaylist(playlistObject)
        showToast(this.$t('User Playlists.CreatePlaylistPrompt.Toast["Playlist {playlistName} has been successfully created."]', {
          playlistName: this.playlistName,
        }))
      } catch (e) {
        showToast(this.$t('User Playlists.CreatePlaylistPrompt.Toast["There was an issue with creating the playlist."]'))
        console.error(e)
      } finally {
        this.hideCreatePlaylistPrompt()
      }
    },

    ...mapActions([
      'addPlaylist',
      'hideCreatePlaylistPrompt',
    ])
  }
})
