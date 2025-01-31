import { defineComponent } from 'vue'
import { isNavigationFailure, NavigationFailureType } from 'vue-router'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtAutoLoadNextPageWrapper from '../../components/ft-auto-load-next-page-wrapper/ft-auto-load-next-page-wrapper.vue'
import FtToggleSwitch from '../../components/ft-toggle-switch/ft-toggle-switch.vue'
import { ctrlFHandler, debounce } from '../../helpers/utils'

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
    fullData() {
      this.filterHistory()
    },
    doCaseSensitiveSearch() {
      this.filterHistory()
      this.saveStateInRouter()
    },
  },
  created: function () {
    document.addEventListener('keydown', this.keyboardShortcutHandler)

    const oldDataLimit = sessionStorage.getItem('History/dataLimit')
    if (oldDataLimit !== null) {
      this.dataLimit = oldDataLimit
    }

    this.filterHistoryDebounce = debounce(this.filterHistory, 500)

    const oldQuery = this.$route.query.searchQueryText ?? ''
    if (oldQuery !== null && oldQuery !== '') {
      // `handleQueryChange` must be called after `filterHistoryDebounce` assigned
      this.handleQueryChange(
        oldQuery,
        {
          limit: this.$route.query.searchDataLimit,
          doCaseSensitiveSearch: this.$route.query.doCaseSensitiveSearch === 'true',
          filterNow: true,
        },
      )
    } else {
      // Only display unfiltered data when no query used last time
      this.filterHistory()
    }
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
  },
  methods: {
    handleQueryChange(query, { limit = null, doCaseSensitiveSearch = null, filterNow = false } = {}) {
      this.query = query

      const newLimit = limit ?? 100
      this.searchDataLimit = newLimit
      const newDoCaseSensitiveSearch = doCaseSensitiveSearch ?? this.doCaseSensitiveSearch
      this.doCaseSensitiveSearch = newDoCaseSensitiveSearch

      this.saveStateInRouter({
        query: query,
        searchDataLimit: newLimit,
        doCaseSensitiveSearch: newDoCaseSensitiveSearch,
      })

      filterNow ? this.filterHistory() : this.filterHistoryAsync()
    },

    increaseLimit: function () {
      if (this.query !== '') {
        this.searchDataLimit += 100
        this.filterHistory()
      } else {
        this.dataLimit += 100
        sessionStorage.setItem('History/dataLimit', this.dataLimit)
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

    async saveStateInRouter({ query = this.query, searchDataLimit = this.searchDataLimit, doCaseSensitiveSearch = this.doCaseSensitiveSearch } = {}) {
      if (query === '') {
        try {
          await this.$router.replace({ name: 'history' })
        } catch (failure) {
          if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
            return
          }

          throw failure
        }
        return
      }

      const routerQuery = {
        searchQueryText: query,
        searchDataLimit: searchDataLimit,
      }
      if (doCaseSensitiveSearch) { routerQuery.doCaseSensitiveSearch = 'true' }
      try {
        await this.$router.replace({
          name: 'history',
          query: routerQuery,
        })
      } catch (failure) {
        if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
          return
        }

        throw failure
      }
    },

    keyboardShortcutHandler: function (event) {
      ctrlFHandler(event, this.$refs.searchBar)
    },
  }
})
