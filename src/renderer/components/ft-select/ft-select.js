import Vue from 'vue'

export default Vue.extend({
  name: 'FtSelect',
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
    }
  }
})
