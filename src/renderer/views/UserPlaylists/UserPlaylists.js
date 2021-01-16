import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtTooltip from '../../components/ft-tooltip/ft-tooltip.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

export default Vue.extend({
  name: 'UserPlaylists',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-tooltip': FtTooltip,
    'ft-loader': FtLoader,
    'ft-button': FtButton,
    'ft-element-list': FtElementList
  },
  data: function () {
    return {
      isLoading: false,
      dataLimit: 100
    }
  },
  computed: {
    favoritesPlaylist: function () {
      return this.$store.getters.getFavorites
    },

    activeData: function () {
      if (this.favoritesPlaylist.videos.length < this.dataLimit) {
        return this.favoritesPlaylist.videos
      } else {
        return this.favoritesPlaylist.videos.slice(0, this.dataLimit)
      }
    }
  },
  watch: {
    activeData() {
      this.isLoading = true
      setTimeout(() => {
        this.isLoading = false
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
    }
  }
})
