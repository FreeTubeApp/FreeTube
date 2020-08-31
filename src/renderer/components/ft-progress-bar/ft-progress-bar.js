import Vue from 'vue'

export default Vue.extend({
  name: 'FtProgressBar',
  computed: {
    progressBarPercentage: function () {
      return this.$store.getters.getProgressBarPercentage
    }
  }
})
