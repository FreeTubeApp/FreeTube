import { defineComponent } from 'vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import { mapActions } from 'vuex'

export default defineComponent({
  name: 'FtPlaylistSelector',
  components: {
    'ft-icon-button': FtIconButton
  },
  props: {
    playlist: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    appearance: {
      type: String,
      default: 'grid',
    },
    selected: {
      type: Boolean,
      required: true,
    },
    disabled: {
      type: Boolean,
      required: true,
    },
    addingDuplicateVideosEnabled: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['selected'],
  data: function () {
    return {
      title: '',
      thumbnail: require('../../assets/img/thumbnail_placeholder.svg'),
      videoCount: 0,

      videoPresenceCountInPlaylistTextShouldBeVisible: false,
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
    },
    toBeAddedToPlaylistVideoList: function () {
      return this.$store.getters.getToBeAddedToPlaylistVideoList
    },

    titleForDisplay: function () {
      if (typeof this.title !== 'string') { return '' }
      if (this.title.length <= 255) { return this.title }

      return `${this.title.substring(0, 255)}...`
    },

    loneToBeAddedToPlaylistVideo: function () {
      if (this.toBeAddedToPlaylistVideoList.length !== 1) { return null }

      return this.toBeAddedToPlaylistVideoList[0]
    },
    loneVideoPresenceCountInPlaylist() {
      if (this.loneToBeAddedToPlaylistVideo == null) { return null }

      const v = this.playlist.videos.reduce((accumulator, video) => {
        return video.videoId === this.loneToBeAddedToPlaylistVideo.videoId
          ? accumulator + 1
          : accumulator
      }, 0)
      // Don't display zero value
      return v === 0 ? null : v
    },
    loneVideoPresenceCountInPlaylistText() {
      if (this.loneVideoPresenceCountInPlaylist == null) { return null }

      return this.$tc('User Playlists.AddVideoPrompt.Added {count} Times', this.loneVideoPresenceCountInPlaylist, {
        count: this.loneVideoPresenceCountInPlaylist,
      })
    },
    multiVideoPresenceCountInPlaylist() {
      if (this.toBeAddedToPlaylistVideoList.length < 2) { return null }

      // Count of to be added videos already present in this playlist
      const v = this.toBeAddedToPlaylistVideoList.reduce((accumulator, toBeAddedToVideo) => {
        return this.playlist.videos.some((pv) => pv.videoId === toBeAddedToVideo.videoId)
          ? accumulator + 1
          : accumulator
      }, 0)
      // Don't display zero value
      return v === 0 ? null : v
    },
    multiVideoPresenceCountInPlaylistText() {
      if (this.multiVideoPresenceCountInPlaylist == null) { return null }

      if (this.addingDuplicateVideosEnabled || this.toBeAddedToPlaylistVideoList.length === this.multiVideoPresenceCountInPlaylist) {
        return this.$t('User Playlists.AddVideoPrompt.{videoCount}/{totalVideoCount} Videos Already Added', {
          videoCount: this.multiVideoPresenceCountInPlaylist,
          totalVideoCount: this.toBeAddedToPlaylistVideoList.length,
        })
      }

      return this.$t('User Playlists.AddVideoPrompt.{videoCount}/{totalVideoCount} Videos Will Be Added', {
        videoCount: this.toBeAddedToPlaylistVideoList.length - this.multiVideoPresenceCountInPlaylist,
        totalVideoCount: this.toBeAddedToPlaylistVideoList.length,
      })
    },
    videoPresenceCountInPlaylistText() {
      return this.loneVideoPresenceCountInPlaylistText ?? this.multiVideoPresenceCountInPlaylistText
    },
    videoPresenceCountInPlaylistTextVisible() {
      if (!this.videoPresenceCountInPlaylistTextShouldBeVisible) { return false }

      return this.videoPresenceCountInPlaylistText != null
    },
  },
  created: function () {
    this.parseUserData()
  },
  methods: {
    parseUserData: function () {
      this.title = this.playlist.playlistName
      if (this.playlist.videos.length > 0) {
        const thumbnailURL = `https://i.ytimg.com/vi/${this.playlist.videos[0].videoId}/mqdefault.jpg`
        if (this.backendPreference === 'invidious') {
          this.thumbnail = thumbnailURL.replace('https://i.ytimg.com', this.currentInvidiousInstanceUrl)
        } else {
          this.thumbnail = thumbnailURL
        }
      }
      this.videoCount = this.playlist.videos.length
    },

    toggleSelection: function () {
      if (this.disabled) { return }

      this.$emit('selected', this.index)
    },

    onVisibilityChanged(visible) {
      if (!visible) { return }

      this.videoPresenceCountInPlaylistTextShouldBeVisible = true
    },

    ...mapActions([
      'openInExternalPlayer'
    ])
  }
})
