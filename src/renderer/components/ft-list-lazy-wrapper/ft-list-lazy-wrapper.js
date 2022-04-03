import Vue from 'vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import FtListChannel from '../ft-list-channel/ft-list-channel.vue'
import FtListPlaylist from '../ft-list-playlist/ft-list-playlist.vue'

export default Vue.extend({
  name: 'FtListLazyWrapper',
  components: {
    'ft-list-video': FtListVideo,
    'ft-list-channel': FtListChannel,
    'ft-list-playlist': FtListPlaylist
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    appearance: {
      type: String,
      required: true
    },
    firstScreen: {
      type: Boolean,
      required: true
    },
    layout: {
      type: String,
      default: 'grid'
    },
    channelBlocked: {
      type: Boolean,
      default: false
    },
    channelTempUnblocked: {
      type: Boolean,
      default: false
    },
    avoidChannelBlocker: {
      type: Boolean,
      default: false
    },
    showBlockedItems: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      visible: this.firstScreen
    }
  },
  methods: {
    onVisibilityChanged: function (visible) {
      this.visible = visible
    }
  }
})
