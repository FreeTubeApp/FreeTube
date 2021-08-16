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
    navigate: function (route) {
      this.openMoreOptions = false
      this.$emit('navigate', route)
    }
  }
})
