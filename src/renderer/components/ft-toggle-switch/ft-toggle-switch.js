import Vue from 'vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'

export default Vue.extend({
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
    }
  },
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
  mounted: function () {
    this.id = this._uid
    this.currentValue = this.defaultValue
  }
})
