import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SideNav',
  data: function () {
    return {
      openMoreOptions: false
    }
  },
  computed: {
    backendPreference: function () {
      let preference = this.$store.getters.getBackendPreference
      if (preference === 'piped') {
        preference = this.$store.getters.getFallbackPreference
      }
      return preference
    },
    fallbackPreference: function() {
      return this.$store.getters.getFallbackPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback && this.$store.getters.getBackendPreference !== 'piped'
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
  }
})
