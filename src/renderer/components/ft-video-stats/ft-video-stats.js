import Vue from 'vue'
import videojs from 'video.js'

// https://stackoverflow.com/questions/49849376/vue-js-triggering-a-method-function-every-x-seconds
export default Vue.extend({
  name: 'FtVideoStats',
  props: {
    stats: {
      type: Object,
      required: true
    },
  },
})
