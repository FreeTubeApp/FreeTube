import { defineComponent } from 'vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'

export default defineComponent({
  name: 'FtToggleSwitch',
  components: {
    'ft-tooltip': FtTooltip
  },
  props: {
    label: {
      type: String,
      required: true
    },
    defaultValue: {
      type: Boolean,
      default: false
    },
    compact: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    tooltip: {
      type: String,
      default: ''
    },
    tooltipPosition: {
      type: String,
      default: 'bottom-left'
    },
    tooltipAllowNewlines: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['change'],
  data: function () {
    return {
      id: '',
      currentValue: false
    }
  },
  watch: {
    defaultValue: function () {
      this.currentValue = this.defaultValue
    }
  },
  created: function () {
    this.id = this._uid
    this.currentValue = this.defaultValue
  },
  methods: {
    change: function () {
      this.$emit('change', this.currentValue)
    },
  }
})
