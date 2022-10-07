import Vue from 'vue'
import FtToastEvents from './ft-toast-events.js'

export default Vue.extend({
  name: 'FtToast',
  data: function () {
    return {
      toasts: []
    }
  },
  mounted: function () {
    FtToastEvents.$on('toast-open', this.open)
  },
  beforeDestroy: function () {
    FtToastEvents.$off('toast-open', this.open)
  },
  methods: {
    performAction: function (index) {
      this.toasts[index].action()
      this.remove(index)
    },
    close: function (toast) {
      // Wait for fade-out to finish
      setTimeout(this.remove, 300, 0)

      toast.isOpen = false
    },
    open: function (message, action, time) {
      const toast = { message: message, action: action || (() => { }), isOpen: false, timeout: null }
      toast.timeout = setTimeout(this.close, time || 3000, toast)
      setTimeout(() => { toast.isOpen = true })
      if (this.toasts.length > 4) {
        this.remove(0)
      }
      this.toasts.push(toast)
    },
    remove: function(index) {
      const removed = this.toasts.splice(index, 1)
      clearTimeout(removed[0].timeout)
    }
  }
})
