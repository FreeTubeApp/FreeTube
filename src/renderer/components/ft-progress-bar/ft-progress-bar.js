import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtProgressBar',
  computed: {
    progressBarPercentage: function () {
      return this.$store.getters.getProgressBarPercentage
    }
  }
})
