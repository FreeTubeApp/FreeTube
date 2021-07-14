import Vue from 'vue'

export default Vue.extend({
  name: 'SideNav',
  data: function () {
    return {
      openMoreOptions: false
    }
  },
  computed: {
    hidePopularVideos: function () {
      return this.$store.getters.getHidePopularVideos
    },
    hideTrendingVideos: function () {
      return this.$store.getters.getHideTrendingVideos
    }
  },
  methods: {
    navigate: function (route, event) {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Tab') {
          return
        }

        event.preventDefault()

        if (event.key !== 'Enter' && event.key !== ' ') {
          return
        }
      }

      this.openMoreOptions = false
      this.$emit('navigate', route)
    }
  }
})
