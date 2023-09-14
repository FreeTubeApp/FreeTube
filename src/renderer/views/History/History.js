import { defineComponent } from 'vue'
import debounce from 'lodash.debounce'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtInput from '../../components/ft-input/ft-input.vue'

export default defineComponent({
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
      query: '',
      activeData: [],
    }
  },
  computed: {
    historyCacheSorted: function () {
      return this.$store.getters.getHistoryCacheSorted
    },

    fullData: function () {
      if (this.historyCacheSorted.length < this.dataLimit) {
        return this.historyCacheSorted
      } else {
        return this.historyCacheSorted.slice(0, this.dataLimit)
      }
    }
  },
  watch: {
    query() {
      this.searchDataLimit = 100
      this.filterHistoryAsync()
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

    if (this.activeData.length < this.historyCacheSorted.length) {
      this.showLoadMoreButton = true
    } else {
      this.showLoadMoreButton = false
    }

    this.filterHistoryDebounce = debounce(this.filterHistory, 500)
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
    filterHistoryAsync: function() {
      // Updating list on every char input could be wasting resources on rendering
      // So run it with delay (to be cancelled when more input received within time)
      this.filterHistoryDebounce()
    },
    filterHistory: function() {
      if (this.query === '') {
        this.activeData = this.fullData
        if (this.activeData.length < this.historyCacheSorted.length) {
          this.showLoadMoreButton = true
        } else {
          this.showLoadMoreButton = false
        }
      } else {
        const lowerCaseQuery = this.query.toLowerCase()
        const filteredQuery = this.historyCacheSorted.filter((video) => {
          if (typeof (video.title) !== 'string' || typeof (video.author) !== 'string') {
            return false
          } else {
            return video.title.toLowerCase().includes(lowerCaseQuery) || video.author.toLowerCase().includes(lowerCaseQuery)
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
  }
})
