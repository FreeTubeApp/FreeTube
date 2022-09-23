import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'

import $ from 'jquery'
import { scrapeTrendingPage } from '@freetube/yt-trending-scraper'

export default Vue.extend({
  name: 'Trending',
  components: {
    'ft-card': FtCard,
    'ft-loader': FtLoader,
    'ft-element-list': FtElementList,
    'ft-icon-button': FtIconButton,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {
      isLoading: false,
      shownResults: [],
      currentTab: 'default',
      tabInfoValues: [
        'default',
        'music',
        'gaming',
        'movies'
      ]
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },
    region: function () {
      return this.$store.getters.getRegion.toUpperCase()
    },
    trendingCache () {
      return this.$store.getters.getTrendingCache
    }
  },
  mounted: function () {
    if (this.trendingCache[this.currentTab] && this.trendingCache[this.currentTab].length > 0) {
      this.getTrendingInfoCache()
    } else {
      this.getTrendingInfo()
    }
  },
  methods: {
    changeTab: function (tab, event) {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Tab') {
          return
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          // navigate trending tabs with arrow keys
          const index = this.tabInfoValues.indexOf(tab)
          // tabs wrap around from leftmost to rightmost, and vice versa
          tab = (event.key === 'ArrowLeft')
            ? this.tabInfoValues[(index > 0 ? index : this.tabInfoValues.length) - 1]
            : this.tabInfoValues[(index + 1) % this.tabInfoValues.length]

          const tabNode = $(`#${tab}Tab`)
          event.target.setAttribute('tabindex', '-1')
          tabNode.attr('tabindex', '0')
          tabNode[0].focus()
        }

        event.preventDefault()
        if (event.key !== 'Enter' && event.key !== ' ') {
          return
        }
      }
      const currentTabNode = $('.trendingInfoTabs > .tab[aria-selected="true"]')
      const newTabNode = $(`#${tab}Tab`)

      // switch selectability from currently focused tab to new tab
      $('.trendingInfoTabs > .tab[tabindex="0"]').attr('tabindex', '-1')
      newTabNode.attr('tabindex', '0')

      currentTabNode.attr('aria-selected', 'false')
      newTabNode.attr('aria-selected', 'true')
      this.currentTab = tab
      if (this.trendingCache[this.currentTab] && this.trendingCache[this.currentTab].length > 0) {
        this.getTrendingInfoCache()
      } else {
        this.getTrendingInfo()
      }
    },

    getTrendingInfo () {
      if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
        this.getTrendingInfoInvidious()
      } else {
        this.getTrendingInfoLocal()
      }
    },

    getTrendingInfoLocal: function () {
      this.isLoading = true

      const param = {
        parseCreatorOnRise: false,
        page: this.currentTab,
        geoLocation: this.region
      }

      scrapeTrendingPage(param).then((result) => {
        const returnData = result.filter((item) => {
          return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
        })

        this.shownResults = returnData
        this.isLoading = false
        const currentTab = this.currentTab
        this.$store.commit('setTrendingCache', { value: returnData, page: currentTab })
      }).then(() => {
        document.querySelector(`#${this.currentTab}Tab`).focus()
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        this.showToast({
          message: `${errorMessage}: ${err}`,
          time: 10000,
          action: () => {
            this.copyToClipboard({ content: err })
          }
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          this.showToast({
            message: this.$t('Falling back to Invidious API')
          })
          this.getTrendingInfoInvidious()
        } else {
          this.isLoading = false
        }
      })
    },

    getTrendingInfoCache: function() {
      this.isLoading = true
      setTimeout(() => {
        this.shownResults = this.trendingCache[this.currentTab]
        this.isLoading = false
      })
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

      this.invidiousAPICall(trendingPayload).then((result) => {
        if (!result) {
          return
        }

        const returnData = result.filter((item) => {
          return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
        })

        this.shownResults = returnData
        this.isLoading = false
        const currentTab = this.currentTab
        this.$store.commit('setTrendingCache', { value: returnData, page: currentTab })
      }).then(() => {
        document.querySelector(`#${this.currentTab}Tab`).focus()
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        this.showToast({
          message: `${errorMessage}: ${err.responseText}`,
          time: 10000,
          action: () => {
            this.copyToClipboard({ content: err.responseText })
          }
        })

        if (process.env.IS_ELECTRON && (this.backendPreference === 'invidious' && this.backendFallback)) {
          this.showToast({
            message: this.$t('Falling back to Local API')
          })
          this.getTrendingInfoLocal()
        } else {
          this.isLoading = false
        }
      })
    },

    ...mapActions([
      'showToast',
      'invidiousAPICall',
      'copyToClipboard'
    ])
  }
})
