import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'

export default Vue.extend({
  name: 'WatchVideoRecommendations',
  components: {
    'ft-card': FtCard,
    'ft-list-video': FtListVideo
  },
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    }
  }
})
