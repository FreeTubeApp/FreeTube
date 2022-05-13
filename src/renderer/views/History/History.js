import Vue from 'vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtInput from '../../components/ft-input/ft-input.vue'

export default Vue.extend({
  name: 'History',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-element-list': FtElementList,
    'ft-button': FtButton,
    'ft-input': FtInput
  },
  data: function () {
    return {
      isLoading: false,
      dataLimit: 100,
      searchDataLimit: 100,
      showLoadMoreButton: false,
      hasQuery: false,
      query: '',
      activeData: []
    }
  },
  computed: {
    historyCache: function () {
      return this.$store.getters.getHistoryCache
    },

    fullData: function () {
      if (this.historyCache.length < this.dataLimit) {
        return this.historyCache
      } else {
        return this.historyCache.slice(0, this.dataLimit)
      }
    }
  },
  watch: {
    query() {
      this.searchDataLimit = 100
      this.filterHistory()
    },
    activeData() {
      this.refreshPage()
    },
    fullData() {
      this.activeData = this.fullData
      this.filterHistory()
    }
  },
  mounted: function () {
    const limit = sessionStorage.getItem('historyLimit')

    if (limit !== null) {
      this.dataLimit = limit
    }

    this.activeData = this.fullData

    if (this.activeData.length < this.historyCache.length) {
      this.showLoadMoreButton = true
    } else {
      this.showLoadMoreButton = false
    }
  },
  methods: {
    increaseLimit: function () {
      if (this.query !== '') {
        this.searchDataLimit += 100
        this.filterHistory()
      } else {
        this.dataLimit += 100
        sessionStorage.setItem('historyLimit', this.dataLimit)
      }
    },
    filterHistory: function(query) {
      if (this.query === '') {
        this.activeData = this.fullData
        if (this.activeData.length < this.historyCache.length) {
          this.showLoadMoreButton = true
        } else {
          this.showLoadMoreButton = false
        }
      } else {
        const filteredQuery = this.historyCache.filter((video) => {
          if (typeof (video.title) !== 'string' || typeof (video.author) !== 'string') {
            return false
          } else {
            return video.title.toLowerCase().includes(this.query.toLowerCase()) || video.author.toLowerCase().includes(this.query.toLowerCase())
          }
        }).sort((a, b) => {
          return b.timeWatched - a.timeWatched
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
      Vue.nextTick(() => {
        this.isLoading = false
        Vue.nextTick(() => {
          window.scrollTo(0, scrollPos)
        })
      })
    }
  }
})
