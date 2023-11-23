import { defineComponent } from 'vue'

let idCounter = 0

function isOutOfViewport(el) {
  if (el == null) { return {} }

  const bounding = el.getBoundingClientRect()
  const out = {}

  out.top = bounding.top < 0
  out.left = bounding.left < 0
  out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight)
  out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth)
  out.horizontal = out.left || out.right
  out.veritical = out.top || out.bottom
  out.any = out.top || out.left || out.bottom || out.right
  out.all = out.top && out.left && out.bottom && out.right

  out.bounding = bounding

  return out
}

export default defineComponent({
  name: 'FtTooltip',
  props: {
    position: {
      type: String,
      default: 'bottom',
      validator: (value) => value === 'bottom' || value === 'left' || value === 'right' || value === 'top' || value === 'bottom-left'
    },
    tooltip: {
      type: String,
      required: true
    },
    allowNewlines: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    const id = `ft-tooltip-${++idCounter}`

    return {
      id,
      isTooltipOutOfViewportResult: {}
    }
  },
  computed: {
    tooltipOutsideViewPort() {
      return this.isTooltipOutOfViewportResult.horizontal
    },
  },
  mounted() {
    this.updateSizeRelatedStates()
    window.addEventListener('resize', this.updateSizeRelatedStates)
  },
  destroyed() {
    window.removeEventListener('resize', this.updateSizeRelatedStates)
  },
  methods: {
    updateSizeRelatedStates() {
      if (this.allowNewlines) {
        // Only when newlines allowed have issue with wrapping
        this.isTooltipOutOfViewportResult = isOutOfViewport(this.$refs.tooltip)
      }
    },
  },
})
