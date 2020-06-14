import Vue from 'vue'

export default Vue.extend({
  name: 'FtToast',
  props: {
    message: {
      type: String,
      required: true,
    },
    action: {
      type: Function,
      default: function () {},
    },
  },
  data: function () {
    return {
      isOpen: false,
    }
  },
  methods: {
    performAction: function () {
      this.action()
      this.close()
    },
    close: function () {
      this.isOpen = false
    },
    open: function () {
      this.isOpen = true
      setTimeout(this.close, 2000)
    },
  },
})
