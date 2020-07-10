import Vue from 'vue'

export default Vue.extend({
  name: 'FtAutoGrid',
  props: {
    grid: {
      type: Boolean,
      required: true
    }
  }
})
