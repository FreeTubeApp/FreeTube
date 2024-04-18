import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtElementList',
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
    initialValueIndex: {
      type: Number,
      default: 0
    }
  },
  data: function () {
    return {
      id: '',
      selectedValue: ''
    }
  },
  computed: {
    inputName: function () {
      const name = this.title.replace(' ', '')
      return name.toLowerCase() + this.id
    }
  },
  mounted: function () {
    this.id = this._uid
    this.selectedValue = this.values[this.initialValueIndex]
  },
  methods: {
    updateSelectedValue: function (value) {
      this.selectedValue = value
    }
  }
})
