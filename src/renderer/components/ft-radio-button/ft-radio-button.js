import Vue from 'vue'

export default Vue.extend({
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
  }
})
