import Vue from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtPlaylistSelector from '../ft-playlist-selector/ft-playlist-selector.vue'
import {
  showToast,
} from '../../helpers/utils'

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
      lastActiveElement: null,
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
    this.lastActiveElement = document.activeElement

    this.playlistName = this.newPlaylistVideoObject.title
    // Faster to input required playlist name
    this.$refs.playlistNameInput.focus()
  },
  destroyed() {
    this.lastActiveElement?.focus()
  },
  methods: {
    createNewPlaylist: function () {
      if (this.playlistName === '') {
        showToast('Playlist name cannot be empty. Please input a name.')
        return
      }

      const nameExists = this.allPlaylists.findIndex((playlist) => {
        return playlist.playlistName === this.playlistName
      })
      if (nameExists !== -1) {
        showToast('There is already a playlist with this name. Please pick a different name.')
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
        showToast(`Playlist ${this.playlistName} has been successfully created.`)
      } catch (e) {
        showToast('There was an issue with creating the playlist.')
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
