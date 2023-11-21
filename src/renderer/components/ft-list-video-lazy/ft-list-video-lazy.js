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
    useChannelsHiddenPreference: {
      type: Boolean,
      default: false,
    },
    hideVideosWithForbiddenTextInTitle: {
      type: Boolean,
      default: true
    }
  },
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

    forbiddenVideoTitleText() {
      return JSON.parse(this.$store.getters.getForbiddenVideoTitleText)
    },

    shouldBeVisible() {
      return !(this.channelsHidden.some(ch => ch.name === this.data.authorId) ||
        this.channelsHidden.some(ch => ch.name === this.data.author) ||
        this.forbiddenVideoTitleText.some((text) => this.data.title?.toLowerCase().includes(text.toLowerCase())))
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
    }
  }
})
