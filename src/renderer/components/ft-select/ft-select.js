import Vue from 'vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'
import { removeWhitespace } from '../../helpers/accessibility'
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
    }
  },
  methods: {
    removeWhitespace
  }
})
