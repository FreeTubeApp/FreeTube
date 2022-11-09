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
    },
    hideSpecificChannels: function() {
      return this.$store.getters.getHideSpecificChannels
    }
  },
  methods: {
    onVisibilityChanged: function (visible) {
      this.visible = visible
    },

    /**
     *  Show or Hide results in the list
     *
     * @return {bool} false to hide the video, true to show it
     */
    showResult: function (data) {
      if (data.type !== undefined) {
        const splitChannels = this.hideSpecificChannels.split(';')
        if (data.type === 'video') {
          if ((data.liveNow || data.lengthSeconds == null) && this.hideLiveStreams) {
            // hide livestreams
            return false
          }
          if (splitChannels.includes(data.authorId) || splitChannels.includes(data.author)) {
            // hide videos by author
            return false
          }
        } else if (data.type === 'channel') {
          if (splitChannels.includes(data.channelID) || splitChannels.includes(data.name)) {
            // hide channels by author
            return false
          }
        } else if (data.type === 'playlist') {
          if (splitChannels.includes(data.author)) {
            // hide playlists by author
            return false
          }
        }
      }
      return true
    }

  }
})
