import Vue from 'vue'
import FtToastEvents from './ft-toast-events.js'

export default Vue.extend({
  name: 'FtToast',
  data: function () {
    return {
      toasts: [
      ],
    }
  },
  mounted: function () {
    FtToastEvents.$on('toast.open', this.open)
  },
  beforeDestroy: function () {
    FtToastEvents.$off('toast.open', this.open)
  },
  methods: {
    performAction: function (toast) {
      toast.action()
      this.close(toast)
    },
    close: function (toast) {
      clearTimeout(toast.timeout)
      // Remove toasts when most recent toast has finished to avoid re-render
      if (this.toasts.filter(toast => toast.isOpen).length === 1) {
        // Wait for fade-out to finish
        setTimeout(this.clear, 300)
      }
      toast.isOpen = false

    },
    open: function (message, action, time) {
      const toast = { message: message, action: action || (() => { }), isOpen: false, timeout: null }
      toast.timeout = setTimeout(this.close, time || 3000, toast)
      setImmediate(() => toast.isOpen = true)
      if (this.toasts.length > 4) {
        for (let i = this.toasts.length - 1; i >= 0; i--) {
          if (!this.toasts[i].isOpen) {
            // Replace the first hidden toast starting from the bottom
            return this.toasts.splice(i, 1, toast)
          }
        }
        // Else replace the most recent
        return this.toasts.splice(4, 1, toast)
      }
      this.toasts.push(toast)
    },
    clear: function () {
      if (this.toasts.every(toast => !toast.isOpen)) {
        this.toasts = []
      }
    }
  },
})
