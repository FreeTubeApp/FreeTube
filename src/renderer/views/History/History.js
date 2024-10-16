import { defineComponent } from 'vue'
import debounce from 'lodash.debounce'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtAutoLoadNextPageWrapper from '../../components/ft-auto-load-next-page-wrapper/ft-auto-load-next-page-wrapper.vue'
import FtToggleSwitch from '../../components/ft-toggle-switch/ft-toggle-switch.vue'
import { ctrlFHandler } from '../../helpers/utils'

const identity = (v) => v

function filterVideosWithQuery(videos, query, attrProcessor = identity) {
  return videos.filter((video) => {
    if (typeof (video.title) === 'string' && attrProcessor(video.title).includes(query)) {
      return true
    } else if (typeof (video.author) === 'string' && attrProcessor(video.author).includes(query)) {
      return true
    }

    return false
  }).sort((a, b) => {
    return b.timeWatched - a.timeWatched
  })
}

export default defineComponent({
  name: 'History',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-element-list': FtElementList,
    'ft-button': FtButton,
    'ft-input': FtInput,
    'ft-auto-load-next-page-wrapper': FtAutoLoadNextPageWrapper,
    'ft-toggle-switch': FtToggleSwitch,
  },
  data: function () {
    return {
      isLoading: false,
      dataLimit: 100,
      searchDataLimit: 100,
      doCaseSensitiveSearch: false,
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
    },
  },
  watch: {
    query() {
      this.searchDataLimit = 100
      this.filterHistoryAsync()
    },
    fullData() {
      this.filterHistory()
    },
    doCaseSensitiveSearch() {
      this.filterHistory()
    },
  },
  mounted: function () {
    document.addEventListener('keydown', this.keyboardShortcutHandler)
    const limit = sessionStorage.getItem('historyLimit')

    if (limit !== null) {
      this.dataLimit = limit
    }

    this.activeData = this.fullData

    this.showLoadMoreButton = this.activeData.length < this.historyCacheSorted.length

    this.filterHistoryDebounce = debounce(this.filterHistory, 500)
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
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
        this.showLoadMoreButton = this.activeData.length < this.historyCacheSorted.length
        return
      }

      let filteredQuery = []
      if (this.doCaseSensitiveSearch) {
        filteredQuery = filterVideosWithQuery(this.historyCacheSorted, this.query)
      } else {
        filteredQuery = filterVideosWithQuery(this.historyCacheSorted, this.query.toLowerCase(), (s) => s.toLowerCase())
      }
      this.activeData = filteredQuery.length < this.searchDataLimit ? filteredQuery : filteredQuery.slice(0, this.searchDataLimit)
      this.showLoadMoreButton = this.activeData.length > this.searchDataLimit
    },
    keyboardShortcutHandler: function (event) {
      ctrlFHandler(event, this.$refs.searchBar)
    },
  }
})
