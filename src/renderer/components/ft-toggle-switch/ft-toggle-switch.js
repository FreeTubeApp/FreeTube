import Vue from 'vue'

export default Vue.extend({
  name: 'FtToggleSwitch',
  props: {
    label: {
      type: String,
      required: true
    },
    defaultValue: {
      type: Boolean,
      default: false
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
