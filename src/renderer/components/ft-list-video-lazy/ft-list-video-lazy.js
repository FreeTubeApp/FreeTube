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
  },
  data: function () {
    return {
      visible: false
    }
  },
  created() {
    this.visible = this.initialVisibleState
  },
  methods: {
    onVisibilityChanged: function (visible) {
      if (visible) {
        this.visible = visible
      }
    }
  }
})
