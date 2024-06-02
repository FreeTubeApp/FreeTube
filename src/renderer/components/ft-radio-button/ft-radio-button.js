import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtRadioButton',
  props: {
    title: {
      type: String,
      required: true
    },
    labels: {
      type: Array,
      required: true
    },
    values: {
      type: Array,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    selected: {
      type: String,
      default: ''
    },
    initialValueIndex: {
      type: Number,
      default: 0
    }
  },
  emits: ['change'],
  data: function () {
    return {
      id: '',
    }
  },
  computed: {
    inputName: function () {
      const name = this.title.replace(' ', '')
      return name.toLowerCase() + this.id
    },
    selectedValue: {
      get: function () {
        return this.selected || this.values[0]
      },
      set: function (value) {
        this.$emit('change', value)
      }
    }
  },
  created: function () {
    this.id = this._uid
    this.selectedValue = this.values[this.initialValueIndex]
  },
  methods: {
    updateSelectedValue: function (value) {
      this.selectedValue = value
    },
    change: function(value) {
      this.$emit('change', value)
    },
  }
})
