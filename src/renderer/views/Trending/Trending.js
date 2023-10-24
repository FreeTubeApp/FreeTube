import { defineComponent } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'

import { copyToClipboard, showToast } from '../../helpers/utils'
import { getLocalTrending } from '../../helpers/api/local'
import { invidiousAPICall } from '../../helpers/api/invidious'
import { Injectables } from '../../../constants'
import { getPipedTrending } from '../../helpers/api/piped'

export default defineComponent({
  name: 'Trending',
  components: {
    'ft-card': FtCard,
    'ft-loader': FtLoader,
    'ft-element-list': FtElementList,
    'ft-icon-button': FtIconButton,
    'ft-flex-box': FtFlexBox
  },
  inject: {
    showOutlines: Injectables.SHOW_OUTLINES
  },
  data: function () {
    return {
      isLoading: false,
      shownResults: [],
      currentTab: 'default',
      trendingInstance: null,
      hideTabs: false
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    fallbackPreference: function() {
      return this.$store.getters.getFallbackPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
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

    this.hideTabs = this.backendPreference === 'piped' && !this.backendFallback

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

      if (this.backendPreference === 'piped') {
        this.getTrendingInfoPiped()
      } else if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
        this.getTrendingInfoInvidious()
      } else {
        this.getTrendingInfoLocal()
      }
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
        if (this.backendFallback && this.backendPreference === 'local') {
          if (this.fallbackPreference === 'invidious') {
            showToast(this.$t('Falling back to Invidious API'))
            this.getTrendingInfoInvidious()
          } else if (this.fallbackPreference === 'piped') {
            showToast(this.$t('Falling back to Piped API'))
            this.getTrendingInfoPiped()
          }
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

        this.shownResults = returnData
        this.isLoading = false
        this.$store.commit('setTrendingCache', { value: returnData, page: this.currentTab })
        setTimeout(() => {
          this.$refs[this.currentTab]?.focus()
        })
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err.responseText}`, 10000, () => {
          copyToClipboard(err.responseText)
        })

        if (this.backendFallback && this.backendPreference === 'invidious') {
          if (this.fallbackPreference === 'piped') {
            showToast(this.$t('Falling back to Piped API'))
            this.getTrendingInfoPiped()
          } else if (process.env.IS_ELECTRON && this.fallbackPreference === 'local') {
            showToast(this.$t('Falling back to local API'))
            this.getTrendingInfoLocal()
          }
        } else {
          this.isLoading = false
        }
      })
    },

    getTrendingInfoPiped: async function() {
      try {
        this.hideTabs = this.backendPreference === 'piped' && !this.backendFallback
        this.isLoading = true
        if (this.currentTab === 'default') {
          this.currentTab = 'default'
          const returnData = await getPipedTrending(this.region)
          this.shownResults = returnData
          this.isLoading = false
          this.$store.commit('setTrendingCache', { value: returnData, page: this.currentTab })
        } else {
          throw new Error('Trending Tabs are not supported by Piped')
        }
      } catch (err) {
        if (err.message !== 'Trending Tabs are not supported by Piped' || this.backendPreference !== 'piped') {
          console.error(err)
          const errorMessage = this.$t('Piped API Error (Click to copy)')
          showToast(`${errorMessage}: ${err}`, 10000, () => {
            copyToClipboard(err)
          })
        } else {
          console.error(err.message)
        }

        if (this.backendFallback && this.backendPreference === 'piped') {
          if (this.fallbackPreference === 'invidious') {
            showToast(this.$t('Falling back to Invidious API'))
            this.getTrendingInfoInvidious()
          } else if (process.env.IS_ELECTRON && this.fallbackPreference === 'local') {
            showToast(this.$t('Falling back to local API'))
            this.getTrendingInfoLocal()
          }
        } else {
          this.isLoading = false
        }
      }
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
          if (!this.isLoading) {
            this.getTrendingInfo(true)
          }
          break
      }
    }
  }
})
