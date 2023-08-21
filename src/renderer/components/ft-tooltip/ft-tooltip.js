import { defineComponent } from 'vue'

let idCounter = 0

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
    }
  },
  data() {
    const id = `ft-tooltip-${++idCounter}`

    return {
      id
    }
  }
})
