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
    }
  },
  emits: ['move-video-down', 'move-video-up', 'pause-player', 'remove-from-playlist'],
  data: function () {
    return {
      visible: this.initialVisibleState,
      stopWatchingInitialVisibleState: null
    }
  },
  created() {
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
      if (visible) {
        this.visible = visible
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
