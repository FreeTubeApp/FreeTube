import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'

export default Vue.extend({
  name: 'WatchVideoChapters',
  components: {
    'ft-card': FtCard
  },
  props: {
    chapters: {
      type: Array,
      required: true
    },
    currentChapterIndex: {
      type: Number,
      required: true
    }
  },
  data: function () {
    return {
      showChapters: false
    }
  },
  methods: {
    changeChapter: function(seconds) {
      this.$emit('timestamp-event', seconds)
    }
  }
})
