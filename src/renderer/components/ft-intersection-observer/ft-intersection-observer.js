import Vue from 'vue'

export default Vue.extend({
  name: 'FtIntersectionObserver',
  props: {
    checkOnMount: {
      type: Boolean,
      default: false
    },
    margin: {
      type: String,
      default: '0px 0px 0px 0px'
    },
    observeParent: {
      type: Boolean,
      default: false
    },
    threshold: {
      type: Number,
      default: 1
    }
  },
  data() {
    const observer = new IntersectionObserver(this.handleIntersection, {
      rootMargin: this.margin,
      threshold: this.threshold
    })
    const runOnce = false

    return {
      observer,
      runOnce
    }
  },
  mounted() {
    this.observer.observe(this.observeParent ? this.$refs.elem.parentElement : this.$refs.elem)
  },
  beforeDestroy() {
    this.observer.disconnect()
  },
  methods: {
    handleIntersection(entries) {
      if (!this.runOnce) {
        this.runOnce = true

        if (!this.checkOnMount) {
          return
        }
      }

      this.$emit(entries[0].isIntersecting ? 'intersected' : 'unintersected')
    }
  }
})
