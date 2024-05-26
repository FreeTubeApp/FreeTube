import { defineComponent } from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { mapActions } from 'vuex'

export default defineComponent({
  name: 'FtPlaylistAddVideoButton',
  components: {
    'ft-icon-button': FtIconButton,
  },
  props: {
    videoId: {
      type: String,
      required: true
    },
    videoTitle: {
      type: String,
      required: true
    },
    channelId: {
      type: String,
      required: true
    },
    channelName: {
      type: String,
      required: true
    },
    viewCount: {
      type: Number,
      required: false,
      default: null,
    },
    lengthSeconds: {
      type: Number,
      required: true
    },

    padding: {
      type: Number,
      default: 10
    },
    size: {
      type: Number,
      default: 20
    },

    showVideoAddedToPlaylistCount: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    allPlaylists: function () {
      return this.$store.getters.getAllPlaylists
    },

    title() {
      const initialText = this.$t('User Playlists.Add to Playlist')
      if (this.videoAddedToPlaylistCountText == null) { return initialText }

      return `${this.$t('User Playlists.Add to Playlist')} (${this.videoAddedToPlaylistCountText})`
    },

    videoAddedToPlaylistCount() {
      if (!this.showVideoAddedToPlaylistCount) { return 0 }

      // Accessing a reactive property has a negligible amount of overhead,
      // however as we know that some users have playlists that have more than 10k items in them
      // it adds up quickly, especially as there are usually lots of ft-list-video instances active at the same time.
      // So create a temporary variable outside of the array, so we only have to do it once.
      // Also the search is re-triggered every time any playlist is modified.
      const videoId = this.videoId
      let count = 0

      this.allPlaylists.forEach((playlist) => {
        const videoAlreadyAdded = playlist.videos.some((v) => {
          return v.videoId === videoId
        })
        if (videoAlreadyAdded) { count += 1 }
      })

      // If only saved in quick bookmark target, don't show the count which is confusing
      if (count === 1 && this.isInQuickBookmarkPlaylist) {
        return 0
      }

      return count
    },
    videoAddedToPlaylistCountText() {
      if (this.videoAddedToPlaylistCount === 0) { return null }

      return this.$tc('User Playlists.Already Added to {playlistCount} Playlist(s)', this.videoAddedToPlaylistCount, {
        playlistCount: this.videoAddedToPlaylistCount,
      })
    },

    quickBookmarkPlaylist() {
      return this.$store.getters.getQuickBookmarkPlaylist
    },
    isQuickBookmarkEnabled() {
      return this.quickBookmarkPlaylist != null
    },
    isInQuickBookmarkPlaylist: function () {
      if (!this.isQuickBookmarkEnabled) { return false }

      // Accessing a reactive property has a negligible amount of overhead,
      // however as we know that some users have playlists that have more than 10k items in them
      // it adds up quickly, especially as there are usually lots of ft-list-video instances active at the same time.
      // So create a temporary variable outside of the array, so we only have to do it once.
      // Also the search is re-triggered every time any playlist is modified.
      const videoId = this.videoId

      return this.quickBookmarkPlaylist.videos.some((video) => {
        return video.videoId === videoId
      })
    },
  },
  methods: {
    togglePlaylistPrompt: function () {
      const videoData = {
        videoId: this.videoId,
        title: this.videoTitle,
        author: this.channelName,
        authorId: this.channelId,
        viewCount: this.viewCount,
        lengthSeconds: this.lengthSeconds,
      }

      this.showAddToPlaylistPromptForManyVideos({ videos: [videoData] })
    },

    ...mapActions([
      'showAddToPlaylistPromptForManyVideos',
    ])
  },
})
