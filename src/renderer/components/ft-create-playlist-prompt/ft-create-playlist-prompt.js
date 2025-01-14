import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'
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
    title: function () {
      return this.$t('User Playlists.CreatePlaylistPrompt.New Playlist Name')
    },
    allPlaylists: function () {
      return this.$store.getters.getAllPlaylists
    },
    newPlaylistVideoObject: function () {
      return this.$store.getters.getNewPlaylistVideoObject
    },

    playlistNameEmpty() {
      return this.playlistName === ''
    },
    playlistNameBlank() {
      return !this.playlistNameEmpty && this.playlistName.trim() === ''
    },
    playlistWithNameExists() {
      // Don't show the message with no name input
      const playlistName = this.playlistName
      if (this.playlistName === '') { return false }

      return this.allPlaylists.some((playlist) => {
        return playlist.playlistName === playlistName
      })
    },
    playlistPersistenceDisabled() {
      return this.playlistNameEmpty || this.playlistNameBlank || this.playlistWithNameExists
    },
  },
  mounted: function () {
    this.playlistName = this.newPlaylistVideoObject.title
    // Faster to input required playlist name
    nextTick(() => this.$refs.playlistNameInput.focus())
  },
  methods: {
    handlePlaylistNameInput(input) {
      if (input.trim() === '') {
        // Need to show message for blank input
        this.playlistName = input
        return
      }

      this.playlistName = input.trim()
    },

    createNewPlaylist: function () {
      // Still possible to attempt to create via pressing enter
      if (this.playlistPersistenceDisabled) { return }

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
