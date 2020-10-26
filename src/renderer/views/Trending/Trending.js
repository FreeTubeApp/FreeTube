import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'

import ytrend from 'yt-trending-scraper'

export default Vue.extend({
  name: 'Trending',
  components: {
    'ft-card': FtCard,
    'ft-loader': FtLoader,
    'ft-element-list': FtElementList,
    'ft-icon-button': FtIconButton
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
    },
    region: function () {
      return this.$store.getters.getRegion.toUpperCase()
    },
    trendingCache () {
      return this.$store.getters.getTrendingCache
    }
  },
  mounted: function () {
    if (this.trendingCache && this.trendingCache.length > 0) {
      this.shownResults = this.trendingCache
    } else {
      this.getTrendingInfo()
    }
  },
  methods: {
    getTrendingInfo () {
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

    getTrendingInfoLocal: function () {
      this.isLoading = true

      console.log('getting local trending')
      ytrend.scrape_trending_page(this.region).then((result) => {
        const returnData = result.filter((item) => {
          return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
        })

        this.shownResults = returnData
        this.isLoading = false
        this.$store.commit('setTrendingCache', this.shownResults)
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
        params: { region: this.region }
      }

      this.$store.dispatch('invidiousAPICall', trendingPayload).then((result) => {
        if (!result) {
          return
        }

        console.log(result)

        const returnData = result.filter((item) => {
          return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
        })

        this.shownResults = returnData
        this.isLoading = false
        this.$store.commit('setTrendingCache', this.shownResults)
      }).catch((err) => {
        console.log(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        this.showToast({
          message: `${errorMessage}: ${err.responseText}`,
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
    },

    ...mapActions([
      'showToast'
    ])
  }
})
