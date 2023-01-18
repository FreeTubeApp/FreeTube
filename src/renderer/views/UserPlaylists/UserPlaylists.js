import { defineComponent, nextTick } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtTooltip from '../../components/ft-tooltip/ft-tooltip.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtInput from '../../components/ft-input/ft-input.vue'

export default defineComponent({
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
      searchDataLimit: 100,
      showLoadMoreButton: false,
      query: '',
      hasQuery: false,
      activeData: []
    }
  },
  computed: {
    favoritesPlaylist: function () {
      return this.$store.getters.getFavorites
    },

    fullData: function () {
      const data = [].concat(this.favoritesPlaylist.videos).reverse()
      if (this.favoritesPlaylist.videos.length < this.dataLimit) {
        return data
      } else {
        return data.slice(0, this.dataLimit)
      }
    }
  },
  watch: {
    query() {
      this.searchDataLimit = 100
      this.filterPlaylist()
    },
    activeData() {
      this.refreshPage()
    },
    fullData() {
      this.activeData = this.fullData
      this.filterPlaylist()
    }
  },
  mounted: function () {
    const limit = sessionStorage.getItem('favoritesLimit')

    if (limit !== null) {
      this.dataLimit = limit
    }

    if (this.activeData.length < this.favoritesPlaylist.videos.length) {
      this.showLoadMoreButton = true
    } else {
      this.showLoadMoreButton = false
    }

    this.activeData = this.fullData
  },
  methods: {
    increaseLimit: function () {
      if (this.query !== '') {
        this.searchDataLimit += 100
        this.filterPlaylist()
      } else {
        this.dataLimit += 100
        sessionStorage.setItem('favoritesLimit', this.dataLimit)
      }
    },
    filterPlaylist: function() {
      if (this.query === '') {
        this.activeData = this.fullData
        if (this.activeData.length < this.favoritesPlaylist.videos.length) {
          this.showLoadMoreButton = true
        } else {
          this.showLoadMoreButton = false
        }
      } else {
        const filteredQuery = this.favoritesPlaylist.videos.filter((video) => {
          if (typeof (video.title) !== 'string' || typeof (video.author) !== 'string') {
            return false
          } else {
            return video.title.toLowerCase().includes(this.query.toLowerCase()) || video.author.toLowerCase().includes(this.query.toLowerCase())
          }
        }).sort((a, b) => {
          return b.timeAdded - a.timeAdded
        })
        if (filteredQuery.length <= this.searchDataLimit) {
          this.showLoadMoreButton = false
        } else {
          this.showLoadMoreButton = true
        }
        this.activeData = filteredQuery.length < this.searchDataLimit ? filteredQuery : filteredQuery.slice(0, this.searchDataLimit)
      }
    },
    refreshPage: function() {
      const scrollPos = window.scrollY || window.scrollTop || document.getElementsByTagName('html')[0].scrollTop
      this.isLoading = true
      nextTick(() => {
        this.isLoading = false
        nextTick(() => {
          window.scrollTo(0, scrollPos)
        })
      })
    }
  }
})
