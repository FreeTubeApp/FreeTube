import Vue from 'vue'
import FtToastEvents from './ft-toast-events.js'

export default Vue.extend({
  name: 'FtToast',
  data: function () {
    return {
      isOpen: false,
      message: '',
      action: () => {},
      queue: [],
    }
  },
  mounted: function () {
    FtToastEvents.$on('toast.open', this.open)
  },
  methods: {
    performAction: function () {
      this.action()
      this.close()
    },
    close: function () {
      this.isOpen = false
      if(this.queue.length !== 0) {
        const toast = this.queue.shift()
        this.open(toast.message, toast.action)
      }
    },
    open: function (message, action) {
      if (this.isOpen) {
        this.queue.push({ message: message, action: action })
        return
      }
      this.message = message
      this.action = action || (() => {});
      this.isOpen = true
      setTimeout(this.close, 2000)
    },
  },
  beforeDestroy: function () {
    FtToastEvents.$off('toast.open', this.open)
  },
})
