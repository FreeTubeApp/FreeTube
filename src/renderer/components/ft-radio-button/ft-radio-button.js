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
    this.selectedValue = this.values[0]
  },
  methods: {
    updateSelectedValue: function (value) {
      this.selectedValue = value
    }
  }
})
