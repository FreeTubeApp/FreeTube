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
    performAction: function (index) {
      this.toasts[index].action()
      this.close(index)
    },
    close: function (index) {
      clearTimeout(this.toasts[index].timeout);
      this.toasts[index].isOpen = false
      if(this.queue.length !== 0) {
        const toast = this.queue.shift()
        this.open(toast.message, toast.action)
      }
    },
    open: function (message, action) {
      for(let i = this.toasts.length - 1; i >= 0 ; i--){
        if (!this.toasts[i].isOpen) {
          return this.showToast(message, action, i)
        }
      }
      this.queue.push({ message: message, action: action })
    },
    showToast: function(message, action, index) {
      this.toasts[index].message = message
      this.toasts[index].action = action || (() => {})
      this.toasts[index].isOpen = true
      this.toasts[index].timeout = setTimeout(this.close, 2000, index)
    }
  },
  beforeDestroy: function () {
    FtToastEvents.$off('toast.open', this.open)
  },
})
