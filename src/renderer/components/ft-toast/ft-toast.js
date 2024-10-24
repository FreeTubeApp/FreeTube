import { defineComponent, nextTick } from 'vue'
import FtToastEvents from './ft-toast-events.js'

let id = 0

export default defineComponent({
  name: 'FtToast',
  data: function () {
    return {
      toasts: []
    }
  },
  mounted: function () {
    FtToastEvents.addEventListener('toast-open', this.open)
  },
  beforeDestroy: function () {
    FtToastEvents.removeEventListener('toast-open', this.open)
  },
  methods: {
    performAction: function (id) {
      const index = this.toasts.findIndex(toast => id === toast.id)

      this.toasts[index].action()
      this.remove(index)
    },
    close: function (toast) {
      // Wait for fade-out to finish
      setTimeout(this.remove, 300, 0)

      toast.isOpen = false
    },
    open: function ({ detail: { message, time, action } }) {
      const toast = {
        message: message,
        action: action || (() => { }),
        isOpen: false,
        timeout: null,
        id: id++,
      }
      toast.timeout = setTimeout(this.close, time || 3000, toast)
      nextTick(() => { toast.isOpen = true })
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
