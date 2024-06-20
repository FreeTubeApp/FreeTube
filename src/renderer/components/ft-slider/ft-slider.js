import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtSlider',
  props: {
    label: {
      type: String,
      required: true
    },
    defaultValue: {
      type: Number,
      required: true
    },
    minValue: {
      type: Number,
      required: true
    },
    maxValue: {
      type: Number,
      required: true
    },
    step: {
      type: Number,
      required: true
    },
    valueExtension: {
      type: String,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change'],
  data: function () {
    return {
      id: '',
      currentValue: 0
    }
  },
  computed: {
    displayLabel: function () {
      if (this.valueExtension === null) {
        return this.currentValue
      } else {
        return `${this.currentValue}${this.valueExtension}`
      }
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
    }
  }
})
