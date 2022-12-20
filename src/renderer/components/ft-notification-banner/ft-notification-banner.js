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
    handleClick: function (response) {
      this.$emit('click', response)
    },

    handleClose: function () {
      this.handleClick(false)
    }
  }
})
