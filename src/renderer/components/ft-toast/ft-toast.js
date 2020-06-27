import Vue from 'vue'
import FtToastEvents from './ft-toast-events.js'

export default Vue.extend({
  name: 'FtToast',
  data: function () {
    return {
      toasts: [
        {isOpen: false, message: '', action: null, timeout: null},
        {isOpen: false, message: '', action: null, timeout: null},
        {isOpen: false, message: '', action: null, timeout: null},
        {isOpen: false, message: '', action: null, timeout: null},
        {isOpen: false, message: '', action: null, timeout: null}
      ],
      queue: [],
    }
  },
  mounted: function () {
    FtToastEvents.$on('toast.open', this.open)
  },
  methods: {
    performAction: function (toast) {
      toast.action()
      this.close(toast)
    },
    close: function (toast) {
      clearTimeout(toast.timeout);
      toast.isOpen = false
      if(this.queue.length !== 0) {
        const nexToast = this.queue.shift()
        this.open(nexToast.message, nexToast.action)
      }
    },
    open: function (message, action) {
      for(let i = this.toasts.length - 1; i >= 0 ; i--){
        const toast = this.toasts[i]
        if (!toast.isOpen) {
          return this.showToast(message, action, toast)
        }
      }
      this.queue.push({ message: message, action: action })
    },
    showToast: function(message, action, toast) {
      toast.message = message
      toast.action = action || (() => {})
      toast.isOpen = true
      toast.timeout = setTimeout(this.close, 2000, toast)
    }
  },
  beforeDestroy: function () {
    FtToastEvents.$off('toast.open', this.open)
  },
})
