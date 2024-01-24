import { defineComponent } from 'vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'

export default defineComponent({
  name: 'FtListVideoLazy',
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
    forceListType: {
      type: String,
      default: null
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
    useChannelsHiddenPreference: {
      type: Boolean,
      default: false,
    },
    hideForbiddenTitles: {
      type: Boolean,
      default: true
    }
  },
  emits: ['pause-player', 'move-video-up', 'move-video-down', 'remove-from-playlist'],
  data: function () {
    return {
      visible: false,
      display: 'block'
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

    forbiddenTitles() {
      if (!this.hideForbiddenTitles) { return [] }
      return JSON.parse(this.$store.getters.getForbiddenTitles)
    },

    shouldBeVisible() {
      return !(this.channelsHidden.some(ch => ch.name === this.data.authorId) ||
        this.channelsHidden.some(ch => ch.name === this.data.author) ||
        this.forbiddenTitles.some((text) => this.data.title?.toLowerCase().includes(text.toLowerCase())))
    }
  },
  created() {
    this.visible = this.initialVisibleState
  },
  methods: {
    onVisibilityChanged: function (visible) {
      if (visible && this.shouldBeVisible) {
        this.visible = visible
      } else if (visible) {
        this.display = 'none'
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
