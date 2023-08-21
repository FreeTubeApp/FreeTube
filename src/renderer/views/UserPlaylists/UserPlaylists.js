import { defineComponent } from 'vue'
import debounce from 'lodash.debounce'
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
      activeData: [],
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
      this.filterPlaylistAsync()
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

    this.activeData = this.fullData

    if (this.activeData.length < this.favoritesPlaylist.videos.length) {
      this.showLoadMoreButton = true
    } else {
      this.showLoadMoreButton = false
    }

    this.filterPlaylistDebounce = debounce(this.filterPlaylist, 500)
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
    filterPlaylistAsync: function() {
      // Updating list on every char input could be wasting resources on rendering
      // So run it with delay (to be cancelled when more input received within time)
      this.filterPlaylistDebounce()
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
        const lowerCaseQuery = this.query.toLowerCase()
        const filteredQuery = this.favoritesPlaylist.videos.filter((video) => {
          if (typeof (video.title) !== 'string' || typeof (video.author) !== 'string') {
            return false
          } else {
            return video.title.toLowerCase().includes(lowerCaseQuery) || video.author.toLowerCase().includes(lowerCaseQuery)
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
  }
})
