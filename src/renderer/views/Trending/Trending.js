import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtRefreshWidget from '../../components/ft-refresh-widget/ft-refresh-widget.vue'

import { copyToClipboard, getRelativeTimeFromDate, setPublishedTimestampsInvidious, showToast } from '../../helpers/utils'
import { getLocalTrending } from '../../helpers/api/local'
import { invidiousAPICall } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'Trending',
  components: {
    'ft-card': FtCard,
    'ft-loader': FtLoader,
    'ft-element-list': FtElementList,
    'ft-icon-button': FtIconButton,
    'ft-flex-box': FtFlexBox,
    'ft-refresh-widget': FtRefreshWidget,
  },
  data: function () {
    return {
      isLoading: false,
      shownResults: [],
      currentTab: 'default',
      trendingInstance: null
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    lastTrendingRefreshTimestamp: function () {
      return getRelativeTimeFromDate(this.$store.getters.getLastTrendingRefreshTimestamp, true)
    },
    region: function () {
      return this.$store.getters.getRegion.toUpperCase()
    },
    trendingCache () {
      return this.$store.getters.getTrendingCache
    }
  },
  mounted: function () {
    document.addEventListener('keydown', this.keyboardShortcutHandler)

    if (this.trendingCache[this.currentTab] && this.trendingCache[this.currentTab].length > 0) {
      this.getTrendingInfoCache()
    } else {
      this.getTrendingInfo()
    }
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
  },
  methods: {
    changeTab: function (tab) {
      if (tab === this.currentTab) {
        return
      }

      this.currentTab = tab
      if (this.trendingCache[this.currentTab] && this.trendingCache[this.currentTab].length > 0) {
        this.getTrendingInfoCache()
      } else {
        this.getTrendingInfo()
      }
    },

    /**
     * @param {KeyboardEvent} event
     * @param {string} tab
     */
    focusTab: function (event, tab) {
      if (!event.altKey) {
        event.preventDefault()
        this.$refs[tab].focus()
        this.showOutlines()
      }
    },

    getTrendingInfo: function (refresh = false) {
      if (refresh) {
        this.trendingInstance = null
        this.$store.commit('clearTrendingCache')
      }

      if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious') {
        this.getTrendingInfoInvidious()
      } else {
        this.getTrendingInfoLocal()
      }

      this.setLastTrendingRefreshTimestamp(new Date())
    },

    getTrendingInfoLocal: async function () {
      this.isLoading = true

      try {
        const { results, instance } = await getLocalTrending(this.region, this.currentTab, this.trendingInstance)

        this.shownResults = results
        this.isLoading = false
        this.trendingInstance = instance

        this.$store.commit('setTrendingCache', { value: results, page: this.currentTab })
        setTimeout(() => {
          this.$refs[this.currentTab]?.focus()
        })
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.getTrendingInfoInvidious()
        } else {
          this.isLoading = false
        }
      }
    },

    getTrendingInfoCache: function () {
      this.shownResults = this.trendingCache[this.currentTab]
    },
    getTrendingInfoInvidious: function () {
      this.isLoading = true

      const trendingPayload = {
        resource: 'trending',
        id: '',
        params: { region: this.region }
      }

      if (this.currentTab !== 'default') {
        trendingPayload.params.type = this.currentTab.charAt(0).toUpperCase() + this.currentTab.slice(1)
      }

      invidiousAPICall(trendingPayload).then((result) => {
        if (!result) {
          return
        }

        const returnData = result.filter((item) => {
          return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
        })

        setPublishedTimestampsInvidious(returnData.filter(item => item.type === 'video'))

        this.shownResults = returnData
        this.isLoading = false
        this.$store.commit('setTrendingCache', { value: returnData, page: this.currentTab })
        setTimeout(() => {
          this.$refs[this.currentTab]?.focus()
        })
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })

        if (process.env.SUPPORTS_LOCAL_API && (this.backendPreference === 'invidious' && this.backendFallback)) {
          showToast(this.$t('Falling back to Local API'))
          this.getTrendingInfoLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    /**
     * This function `keyboardShortcutHandler` should always be at the bottom of this file
     * @param {KeyboardEvent} event the keyboard event
     */
    keyboardShortcutHandler: function (event) {
      if (event.ctrlKey || document.activeElement.classList.contains('ft-input')) {
        return
      }
      // Avoid handling events due to user holding a key (not released)
      // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
      if (event.repeat) { return }

      switch (event.key) {
        case 'r':
        case 'R':
        case 'F5':
          if (!this.isLoading) {
            this.getTrendingInfo(true)
          }
          break
      }
    },

    ...mapActions([
      'showOutlines'
    ]),

    ...mapMutations([
      'setLastTrendingRefreshTimestamp'
    ])
  }
})
