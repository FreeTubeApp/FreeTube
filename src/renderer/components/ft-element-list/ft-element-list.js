import Vue from 'vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtGrid from '../ft-grid/ft-grid.vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import FtListChannel from '../ft-list-channel/ft-list-channel.vue'
import FtListPlaylist from '../ft-list-playlist/ft-list-playlist.vue'

export default Vue.extend({
  name: 'FtElementList',
  components: {
    'ft-flex-box': FtFlexBox,
    'ft-grid': FtGrid,
    'ft-list-video': FtListVideo,
    'ft-list-channel': FtListChannel,
    'ft-list-playlist': FtListPlaylist
  },
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  data: function () {
    return {
      test: 'hello'
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    }
  }
})
