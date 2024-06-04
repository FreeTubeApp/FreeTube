import { defineComponent, nextTick } from 'vue'
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
    playlistWithNameExists() {
      // Don't show the message with no name input
      const playlistName = this.playlistName
      if (this.playlistName === '') { return false }

      return this.allPlaylists.some((playlist) => {
        return playlist.playlistName === playlistName
      })
    },
  },
  mounted: function () {
    this.playlistName = this.newPlaylistVideoObject.title
    // Faster to input required playlist name
    nextTick(() => this.$refs.playlistNameInput.focus())
  },
  methods: {
    handlePlaylistNameInput(input) {
      this.playlistName = input.trim()
    },

    createNewPlaylist: function () {
      // Empty playlist name check moved to template
      // Duplicate playlist check moved to template

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
