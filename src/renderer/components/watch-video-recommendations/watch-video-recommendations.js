import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtListVideoLazy from '../ft-list-video-lazy/ft-list-video-lazy.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'

export default defineComponent({
  name: 'WatchVideoRecommendations',
  components: {
    'ft-card': FtCard,
    'ft-list-video-lazy': FtListVideoLazy,
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
    enableAutoplay: function () {
      return this.$store.getters.getEnableAutoplay
    },
    hideRecommendedVideos: function () {
      return this.$store.getters.getHideRecommendedVideos
    }
  },
  methods: {
    ...mapActions([
      'updateEnableAutoplay'
    ])
  }
})
