import Vue from 'vue'
import FtInput from '../ft-input/ft-input.vue'
import FtSearchFilters from '../ft-search-filters/ft-search-filters.vue'
import $ from 'jquery'
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
  mounted: function () {
    window.addEventListener('resize', function(event) {
      const width = event.srcElement.innerWidth
      const searchContainer = $('.searchContainer').get(0)

      if (width > 680) {
        searchContainer.style.display = ''
      } else {
        searchContainer.style.display = 'none'
      }
    })
  },
  methods: {
    goToSearch: function (query) {
      console.log(this)
      this.showFilters = false
      const appWidth = $(window).width()

      if (appWidth <= 680) {
        const searchContainer = $('.searchContainer').get(0)
        searchContainer.style.display = 'none'
      }

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

    toggleSearchContainer: function () {
      const searchContainer = $('.searchContainer').get(0)

      if (searchContainer.style.display === 'none') {
        searchContainer.style.display = ''
      } else {
        searchContainer.style.display = 'none'
      }

      this.showFilters = false
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
