import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtPlaylistSelectionPrompt from '../../components/ft-playlist-selection-prompt/ft-playlist-selection-prompt.vue'
import {
  showToast,
} from '../../helpers/utils'

export default defineComponent({
  name: 'FtPlaylistAddVideoPrompt',
  components: {
    'ft-playlist-selection-prompt': FtPlaylistSelectionPrompt,
  },
  computed: {
    title() {
      return this.$tc('User Playlists.AddVideoPrompt.Select a playlist to add your N videos to', this.toBeAddedToPlaylistVideoCount, {
        videoCount: this.toBeAddedToPlaylistVideoCount,
      })
    },

    allPlaylists() {
      return this.$store.getters.getAllPlaylists
    },

    toBeAddedToPlaylistVideoList() {
      return this.$store.getters.getToBeAddedToPlaylistVideoList
    },
    toBeAddedToPlaylistVideoCount() {
      return this.toBeAddedToPlaylistVideoList.length
    },
  },
  methods: {
    hide() {
      this.hideAddToPlaylistPrompt()
    },

    addSelectedToPlaylists(playlistIds) {
      const addedPlaylistIds = new Set()

      if (playlistIds.length === 0) {
        showToast(this.$t('User Playlists.AddVideoPrompt.Toast["You haven\'t selected any playlist yet."]'))
        return
      }

      playlistIds.forEach((selectedPlaylistId) => {
        const playlist = this.allPlaylists.find((list) => list._id === selectedPlaylistId)
        if (playlist == null) { return }

        this.addVideos({
          _id: playlist._id,
          // Use [].concat to avoid `do not mutate vuex store state outside mutation handlers`
          videos: [].concat(this.toBeAddedToPlaylistVideoList),
        })
        addedPlaylistIds.add(playlist._id)
        // Update playlist's `lastUpdatedAt`
        this.updatePlaylist({ _id: playlist._id })
      })

      let message
      if (addedPlaylistIds.size === 1) {
        message = this.$tc('User Playlists.AddVideoPrompt.Toast.{videoCount} video(s) added to 1 playlist', this.toBeAddedToPlaylistVideoCount, {
          videoCount: this.toBeAddedToPlaylistVideoCount,
          playlistCount: addedPlaylistIds.size,
        })
      } else {
        message = this.$tc('User Playlists.AddVideoPrompt.Toast.{videoCount} video(s) added to {playlistCount} playlists', this.toBeAddedToPlaylistVideoCount, {
          videoCount: this.toBeAddedToPlaylistVideoCount,
          playlistCount: addedPlaylistIds.size,
        })
      }

      showToast(message)
      this.hide()
    },

    ...mapActions([
      'addVideos',
      'updatePlaylist',
      'hideAddToPlaylistPrompt',
    ])
  }
})
