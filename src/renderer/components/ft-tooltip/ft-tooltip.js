import Vue from 'vue'
import { uniqueId } from 'lodash'

export default Vue.extend({
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
    const id = uniqueId('ft-tooltip-')

    return {
      id
    }
  }
})
