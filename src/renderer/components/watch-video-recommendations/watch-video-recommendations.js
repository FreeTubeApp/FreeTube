import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'

export default Vue.extend({
  name: 'WatchVideoRecommendations',
  components: {
    'ft-card': FtCard,
    'ft-list-video': FtListVideo,
    'ft-toggle-switch': FtToggleSwitch
  },
  props: {
    data: {
      type: Array,
      required: true
    },
    showAutoplay: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    },
    playNextVideo: function () {
      return this.$store.getters.getPlayNextVideo
    },
    hideRecommendedVideos: function () {
      return this.$store.getters.getHideRecommendedVideos
    }
  },
  methods: {
    ...mapActions([
      'updatePlayNextVideo'
    ])
  }
})
