import { defineComponent } from 'vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'

export default defineComponent({
  name: 'FtListVideoNumbered',
  components: {
    'ft-list-video': FtListVideo
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    playlistId: {
      type: String,
      default: null
    },
    playlistType: {
      type: String,
      default: null
    },
    playlistIndex: {
      type: Number,
      default: null
    },
    playlistReverse: {
      type: Boolean,
      default: false
    },
    playlistShuffle: {
      type: Boolean,
      default: false
    },
    playlistLoop: {
      type: Boolean,
      default: false
    },
    playlistItemId: {
      type: String,
      default: null,
    },
    appearance: {
      type: String,
      required: true
    },
    initialVisibleState: {
      type: Boolean,
      default: false,
    },
    alwaysShowAddToPlaylistButton: {
      type: Boolean,
      default: false,
    },
    quickBookmarkButtonEnabled: {
      type: Boolean,
      default: true,
    },
    canMoveVideoUp: {
      type: Boolean,
      default: false,
    },
    canMoveVideoDown: {
      type: Boolean,
      default: false,
    },
    canRemoveFromPlaylist: {
      type: Boolean,
      default: false,
    },
    videoIndex: {
      type: Number,
      default: -1
    },
    isCurrentVideo: {
      type: Boolean,
      default: false
    },
    useChannelsHiddenPreference: {
      type: Boolean,
      default: false,
    },
    isInvidiousPlaylist: {
      type: Boolean,
      default: false
    },
    origin: {
      type: String,
      default: null
    },
  },
  emits: ['move-video-down', 'move-video-up', 'pause-player', 'remove-from-playlist'],
  data: function () {
    return {
      visible: false,
      show: true,
      stopWatchingInitialVisibleState: null
    }
  },
  computed: {
    channelsHidden() {
      // Some component users like channel view will have this disabled
      if (!this.useChannelsHiddenPreference) { return [] }

      return JSON.parse(this.$store.getters.getChannelsHidden).map((ch) => {
        // Legacy support
        if (typeof ch === 'string') {
          return { name: ch, preferredName: '', icon: '' }
        }
        return ch
      })
    },

    // As we only use this component in Playlist and watch-video-playlist,
    // where title filtering is never desired, we don't have any title filtering logic here,
    // like we do in ft-list-video-lazy

    shouldBeVisible() {
      return !(this.channelsHidden.some(ch => ch.name === this.data.authorId) ||
        this.channelsHidden.some(ch => ch.name === this.data.author))
    }
  },
  created() {
    this.visible = this.initialVisibleState

    if (!this.initialVisibleState) {
      this.stopWatchingInitialVisibleState = this.$watch('initialVisibleState', (newValue) => {
        this.visible = newValue
        this.stopWatchingInitialVisibleState()
        this.stopWatchingInitialVisibleState = null
      })
    }
  },
  methods: {
    onVisibilityChanged: function (visible) {
      if (visible && this.shouldBeVisible) {
        this.visible = visible
        if (this.stopWatchingInitialVisibleState) {
          this.stopWatchingInitialVisibleState()
          this.stopWatchingInitialVisibleState = null
        }
      } else if (visible) {
        this.show = false
        if (this.stopWatchingInitialVisibleState) {
          this.stopWatchingInitialVisibleState()
          this.stopWatchingInitialVisibleState = null
        }
      }
    },
    pausePlayer: function () {
      this.$emit('pause-player')
    },
    moveVideoUp: function () {
      this.$emit('move-video-up')
    },
    moveVideoDown: function () {
      this.$emit('move-video-down')
    },
    removeFromPlaylist: function () {
      this.$emit('remove-from-playlist')
    }
  }
})
