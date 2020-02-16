import Vue from 'vue'

export default Vue.extend({
  name: 'FtLoader',
  props: {
    fullscreen: {
      type: Boolean,
      default: false
    }
  }
})
