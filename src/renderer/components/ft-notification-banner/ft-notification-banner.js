import Vue from 'vue'

export default Vue.extend({
  name: 'FtNotificationBanner',
  props: {
    message: {
      type: String,
      required: true
    }
  },
  computed: {
    progressBarPercentage: function () {
      return this.$store.getters.getProgressBarPercentage
    }
  },
  methods: {
    handleClick: function (response, event) {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Tab') {
          return
        }

        event.preventDefault()

        if (event.key !== 'Enter') {
          return
        }
      }

      this.$emit('click', response)
    },

    handleClose: function (event) {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Tab') {
          return
        }

        event.preventDefault()

        if (event.key !== 'Enter') {
          return
        }
      }

      event.stopPropagation()
      this.handleClick(false)
    }
  }
})
