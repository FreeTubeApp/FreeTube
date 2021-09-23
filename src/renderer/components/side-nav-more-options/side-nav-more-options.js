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
    },
    hideCompactSidebarText: function () {
      return this.$store.getters.getHideCompactSidebarText
    }
  },
  methods: {
    navigate: function (route) {
      this.openMoreOptions = false
      this.$emit('navigate', route)
    }
  }
})
