import { defineComponent, nextTick } from 'vue'
import FtCard from '../ft-card/ft-card.vue'

export default defineComponent({
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
      showChapters: false,
      currentIndex: 0
    }
  },
  computed: {
    currentChapter: function () {
      return this.chapters[this.currentIndex]
    },

    currentTitle: function () {
      return this.currentChapter.title
    },

    compact: function () {
      return !this.chapters[0].thumbnail
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
    },

    navigateChapters(direction) {
      const chapterElements = Array.from(this.$refs.chaptersWrapper.children)
      const focusedIndex = chapterElements.indexOf(document.activeElement)

      let newIndex = focusedIndex
      if (direction === 'up') {
        if (focusedIndex === 0) {
          newIndex = chapterElements.length - 1
        } else {
          newIndex--
        }
      } else {
        if (focusedIndex === chapterElements.length - 1) {
          newIndex = 0
        } else {
          newIndex++
        }
      }

      chapterElements[newIndex].focus()
    },

    toggleShowChapters() {
      this.showChapters = !this.showChapters

      if (this.showChapters) { this.scrollToCurrentChapter() }
    },

    scrollToCurrentChapter() {
      const container = this.$refs.chaptersWrapper
      const currentChaptersItem = (this.$refs.currentChaptersItem || [])[0]
      // Must wait until rendering done after value change
      nextTick(() => {
        if (container != null && currentChaptersItem != null) {
          container.scrollTop = currentChaptersItem.offsetTop - container.offsetTop
        }
      })
    },
  }
})
