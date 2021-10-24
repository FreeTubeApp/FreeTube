import Vue from 'vue'

export default Vue.extend({
  name: 'FtVideoStats',
  props: {
    stats: {
      type: Object,
      required: true
    },
  },
})
