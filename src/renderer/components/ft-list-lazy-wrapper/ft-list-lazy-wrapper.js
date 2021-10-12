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
    }
  },
  data: function () {
    return {
      visible: this.firstScreen
    }
  },
  computed: {
    hideLiveStreams: function() {
      return this.$store.getters.getHideLiveStreams
    }
  },
  methods: {
    onVisibilityChanged: function (visible) {
      this.visible = visible
    }
  }
})
