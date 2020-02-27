import Vue from 'vue'
import FtInput from '../ft-input/ft-input.vue'
import FtSearchFilters from '../ft-search-filters/ft-search-filters.vue'
import router from '../../router/index.js'

export default Vue.extend({
  name: 'TopNav',
  components: {
    FtInput,
    FtSearchFilters
  },
  data: () => {
    return {
      component: this,
      showFilters: false
    }
  },
  computed: {
    searchSettings: function () {
      return this.$store.getters.getSearchSettings
    },

    isSideNavOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    },

    barColor: function () {
      return this.$store.getters.getBarColor
    }
  },
  methods: {
    goToSearch: function (query) {
      console.log(this)
      this.showFilters = false
      router.push(
        {
          path: `/search/${query}`,
          query: {
            sortBy: this.searchSettings.sortBy,
            time: this.searchSettings.time,
            type: this.searchSettings.type,
            duration: this.searchSettings.duration
          }
        }
      )
    },

    historyBack: function () {
      window.history.back()
    },

    historyForward: function () {
      window.history.forward()
    },

    toggleSideNav: function () {
      this.$store.commit('toggleSideNav')
    }
  }
})
