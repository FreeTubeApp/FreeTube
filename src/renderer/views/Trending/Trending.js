import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

import ytrend from 'yt-trending-scraper'

export default Vue.extend({
  name: 'Trending',
  components: {
    'ft-card': FtCard,
    'ft-loader': FtLoader,
    'ft-element-list': FtElementList
  },
  data: function () {
    return {
      isLoading: false,
      shownResults: []
    }
  },
  computed: {
    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    }
  },
  mounted: function () {
    if (!this.usingElectron) {
      this.getVideoInformationInvidious()
    } else {
      switch (this.backendPreference) {
        case 'local':
          this.getTrendingInfoLocal()
          break
        case 'invidious':
          this.getTrendingInfoInvidious()
          break
      }
    }
  },
  methods: {
    getTrendingInfoLocal: function () {
      this.isLoading = true

      console.log('getting local trending')

      ytrend.scrape_trending_page().then((result) => {
        const returnData = result.filter((item) => {
          return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
        })

        this.shownResults = this.shownResults.concat(returnData)
        this.isLoading = false
      }).catch((err) => {
        console.log(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        this.showToast({
          message: `${errorMessage}: ${err}`,
          time: 10000,
          action: () => {
            navigator.clipboard.writeText(err)
          }
        })
        if (!this.usingElectron || (this.backendPreference === 'local' && this.backendFallback)) {
          this.showToast({
            message: this.$t('Falling back to Invidious API')
          })
          this.getTrendingInfoInvidious()
        } else {
          this.isLoading = false
        }
      })
    },

    getTrendingInfoInvidious: function () {
      this.isLoading = true

      const trendingPayload = {
        resource: 'trending',
        id: '',
        params: {}
      }

      this.$store.dispatch('invidiousAPICall', trendingPayload).then((result) => {
        if (!result) {
          return
        }

        console.log(result)

        const returnData = result.filter((item) => {
          return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
        })

        this.shownResults = this.shownResults.concat(returnData)
        this.isLoading = false
      }).catch((err) => {
        console.log(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        this.showToast({
          message: `${errorMessage}: ${err}`,
          time: 10000,
          action: () => {
            navigator.clipboard.writeText(err)
          }
        })

        if (!this.usingElectron || (this.backendPreference === 'invidious' && this.backendFallback)) {
          this.showToast({
            message: this.$t('Falling back to Local API')
          })
          this.getTrendingInfoLocal()
        } else {
          this.isLoading = false
        }
      })
    }
  }
})
