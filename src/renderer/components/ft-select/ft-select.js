import Vue from 'vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'

export default Vue.extend({
  name: 'FtSelect',
  components: {
    'ft-tooltip': FtTooltip
  },
  props: {
    placeholder: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      required: true
    },
    selectNames: {
      type: Array,
      required: true
    },
    selectValues: {
      type: Array,
      required: true
    },
    tooltip: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    sanitizedId: {
      type: String,
      default: null
    },
    describeById: {
      type: String,
      default: null
    }
  },
  computed: {
    sanitizedPlaceholder: function() {
      return sanitizeForHtmlId(this.placeholder)
    }
  }
})
