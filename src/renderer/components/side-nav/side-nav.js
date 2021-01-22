import Vue from 'vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import SideNavMoreOptions from '../side-nav-more-options/side-nav-more-options.vue'
import router from '../../router/index.js'

export default Vue.extend({
  name: 'SideNav',
  components: {
    'ft-flex-box': FtFlexBox,
    'side-nav-more-options': SideNavMoreOptions
  },
  computed: {
    isOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    activeSubscriptions: function () {
      const profile = JSON.parse(JSON.stringify(this.profileList[this.activeProfile]))
      return profile.subscriptions.sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        if (nameA < nameB) {
          return -1
        }
        if (nameA > nameB) {
          return 1
        }
        return 0
      }).map((channel) => {
        if (this.backendPreference === 'invidious') {
          channel.thumbnail = channel.thumbnail.replace('https://yt3.ggpht.com', `${this.invidiousInstance}/ggpht/`)
        }

        return channel
      })
    },
    hidePopularVideos: function () {
      return this.$store.getters.getHidePopularVideos
    },
    hidePlaylists: function () {
      return this.$store.getters.getHidePlaylists
    },
    hideTrendingVideos: function () {
      return this.$store.getters.getHideTrendingVideos
    },
    hideActiveSubscriptions: function () {
      return this.$store.getters.getHideActiveSubscriptions
    }
  },
  methods: {
    navigate: function (route) {
      router.push('/' + route)
    },

    goToChannel: function (id) {
      this.$router.push({ path: `/channel/${id}` })
    }
  }
})
