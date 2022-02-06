import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtTooltip from '../../components/ft-tooltip/ft-tooltip.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtInput from '../../components/ft-input/ft-input.vue'

export default Vue.extend({
  name: 'UserPlaylists',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-tooltip': FtTooltip,
    'ft-loader': FtLoader,
    'ft-button': FtButton,
    'ft-element-list': FtElementList,
    'ft-input': FtInput
  },
  data: function () {
    return {
      isLoading: false,
      dataLimit: 100,
      hasQuery: false
    }
  },
  computed: {
    favoritesPlaylist: function () {
      if (!this.hasQuery) {
        return this.$store.getters.getFavorites
      } else {
        return this.$store.getters.getSearchPlaylistCache
      }
    },

    activeData: function () {
      const data = [].concat(this.favoritesPlaylist.videos).reverse()
      if (this.favoritesPlaylist.videos.length < this.dataLimit) {
        return data
      } else {
        return data.slice(0, this.dataLimit)
      }
    }
  },
  watch: {
    activeData() {
      const scrollPos = window.scrollY || window.scrollTop || document.getElementsByTagName('html')[0].scrollTop
      this.isLoading = true
      setTimeout(() => {
        this.isLoading = false
        // This is kinda ugly, but should fix a few existing issues
        setTimeout(() => {
          window.scrollTo(0, scrollPos)
        }, 100)
      }, 100)
    }
  },
  mounted: function () {
    const limit = sessionStorage.getItem('favoritesLimit')

    if (limit !== null) {
      this.dataLimit = limit
    }
  },
  methods: {
    increaseLimit: function () {
      this.dataLimit += 100
      sessionStorage.setItem('favoritesLimit', this.dataLimit)
    },
    filterPlaylist: function(query) {
      this.hasQuery = query !== ''
      this.$store.dispatch('searchFavoritePlaylist', query)
    }
  }
})
