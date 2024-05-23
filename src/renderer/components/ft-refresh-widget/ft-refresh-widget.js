import { defineComponent } from 'vue'

import FtIconButton from '../ft-icon-button/ft-icon-button.vue'

export default defineComponent({
  name: 'FtRefreshWidget',
  components: {
    'ft-icon-button': FtIconButton,
  },
  props: {
    disableRefresh: {
      type: Boolean,
      default: false
    },
    lastRefreshTimestamp: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      required: true
    }
  },
  emits: ['click'],
  methods: {
    click: function() {
      this.$emit('click')
    }
  }
})
