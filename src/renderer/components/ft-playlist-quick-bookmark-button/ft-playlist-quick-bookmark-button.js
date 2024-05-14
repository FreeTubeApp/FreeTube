import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { showToast } from '../../helpers/utils'

export default defineComponent({
  name: 'FtPlaylistQuickBookmarkButton',
  components: {
    'ft-icon-button': FtIconButton,
  },
  props: {
    id: {
      type: String,
      required: true
    },
    title: {
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
      required: true
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
    alwaysVisible: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
      selectQuickBookmarkTargetPromptCloseCallback: null,
    }
  },
  computed: {
    quickBookmarkPlaylistId() {
      return this.$store.getters.getQuickBookmarkTargetPlaylistId
    },
    quickBookmarkPlaylist() {
      return this.$store.getters.getPlaylist(this.quickBookmarkPlaylistId)
    },
    isQuickBookmarkEnabled() {
      return this.quickBookmarkPlaylist != null
    },
    isInQuickBookmarkPlaylist: function () {
      if (!this.isQuickBookmarkEnabled) { return false }

      return this.quickBookmarkPlaylist.videos.some((video) => {
        return video.videoId === this.id
      })
    },
    quickBookmarkIconText: function () {
      if (!this.isQuickBookmarkEnabled) { return this.$t('User Playlists.Add to Playlist') }

      const translationProperties = {
        playlistName: this.quickBookmarkPlaylist.playlistName,
      }
      return this.isInQuickBookmarkPlaylist
        ? this.$t('User Playlists.Remove from Favorites', translationProperties)
        : this.$t('User Playlists.Add to Favorites', translationProperties)
    },
    quickBookmarkIconTheme: function () {
      return this.isInQuickBookmarkPlaylist ? 'base favorite' : 'base'
    },
    selectQuickBookmarkTargetPromptShown() {
      return this.$store.getters.getShowSelectQuickBookmarkTargetPrompt
    },
  },
  watch: {
    selectQuickBookmarkTargetPromptShown(value) {
      if (value) { return }
      // Execute on prompt close

      if (this.selectQuickBookmarkTargetPromptCloseCallback == null) { return }
      this.selectQuickBookmarkTargetPromptCloseCallback()
    },
  },
  methods: {
    toggleQuickBookmarked() {
      if (!this.isQuickBookmarkEnabled) {
        showToast(this.$t('User Playlists["Quick Bookmark Disabled. Pick a Playlist as Quick Bookmark Target"]'))
        this.selectQuickBookmarkTargetPromptCloseCallback = () => {
          // Run once only
          this.selectQuickBookmarkTargetPromptCloseCallback = null

          // Auto add this video to quick bookmark target if target set in prompt
          if (!this.isQuickBookmarkEnabled) { return }

          // Users don't know the video is in target playlist or not
          // Assuming they want to add the video
          // Add it only if not already present in target playlist
          if (!this.isInQuickBookmarkPlaylist) {
            this.addToQuickBookmarkPlaylist()
          }
        }
        this.showSelectQuickBookmarkTargetPrompt()
        return
      }

      if (this.isInQuickBookmarkPlaylist) {
        this.removeFromQuickBookmarkPlaylist()
      } else {
        this.addToQuickBookmarkPlaylist()
      }
    },
    addToQuickBookmarkPlaylist() {
      const videoData = {
        videoId: this.id,
        title: this.title,
        author: this.channelName,
        authorId: this.channelId,
        viewCount: this.viewCount,
        lengthSeconds: this.lengthSeconds,
      }

      this.addVideos({
        _id: this.quickBookmarkPlaylist._id,
        videos: [videoData],
      })
      // Update playlist's `lastUpdatedAt`
      this.updatePlaylist({ _id: this.quickBookmarkPlaylist._id })

      // TODO: Maybe show playlist name
      showToast(this.$t('Video.Video has been saved'))
    },
    removeFromQuickBookmarkPlaylist() {
      this.removeVideo({
        _id: this.quickBookmarkPlaylist._id,
        // Remove all playlist items with same videoId
        videoId: this.id,
      })
      // Update playlist's `lastUpdatedAt`
      this.updatePlaylist({ _id: this.quickBookmarkPlaylist._id })

      // TODO: Maybe show playlist name
      showToast(this.$t('Video.Video has been removed from your saved list'))
    },

    ...mapActions([
      'showSelectQuickBookmarkTargetPrompt',
      'addVideos',
      'updatePlaylist',
      'removeVideo',
    ])
  }
})
