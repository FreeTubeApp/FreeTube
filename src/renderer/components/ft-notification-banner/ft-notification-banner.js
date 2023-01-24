import { defineComponent } from 'vue'

export default defineComponent({
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
