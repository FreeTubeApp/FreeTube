import Vue from 'vue'

export default Vue.extend({
  name: 'SideNav',
  data: function () {
    return {
      openMoreOptions: false
    }
  },
  computed: {
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    hidePopularVideos: function () {
      return this.$store.getters.getHidePopularVideos
    },
    hideTrendingVideos: function () {
      return this.$store.getters.getHideTrendingVideos
    },
    hideLabelsSideBar: function () {
      return this.$store.getters.getHideLabelsSideBar
    },
    applyNavIconExpand: function() {
      return {
        navIconExpand: this.hideLabelsSideBar
      }
    }
  },
  methods: {
    navigate: function (route) {
      this.openMoreOptions = false
      this.$router.push('/' + route)
    }
  }
})
