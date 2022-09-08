import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'

export default Vue.extend({
  name: 'WatchVideoChapters',
  components: {
    'ft-card': FtCard
  },
  props: {
    compact: {
      type: Boolean,
      default: false
    },
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
      showChapters: false,
      currentIndex: 0
    }
  },
  watch: {
    currentChapterIndex: function (value) {
      if (this.currentIndex !== value) {
        this.currentIndex = value
      }
    }
  },
  mounted: function () {
    this.currentIndex = this.currentChapterIndex
  },
  methods: {
    changeChapter: function(index) {
      this.currentIndex = index
      this.$emit('timestamp-event', this.chapters[index].startSeconds)
    }
  }
})
