import Vue from 'vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'

export default Vue.extend({
  name: 'Popular',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
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
    popularCache: function () {
      return this.$store.getters.getPopularCache
    }
  },
  mounted: function () {
    this.getTrendingInfo()
  },
  methods: {
    refreshTrendingInfo: async function () {
      await this.fetchTrendingInfo()
      await this.getTrendingInfo()
    },
    fetchTrendingInfo: async function () {
      const searchPayload = {
        resource: 'popular',
        id: '',
        params: {}
      }

      const result = await this.$store.dispatch('invidiousAPICall', searchPayload).catch((err) => {
        console.log(err)
      })

      if (!result) {
        return
      }

      console.log(result)

      const returnData = result.filter((item) => {
        return item.type === 'video' || item.type === 'shortVideo' || item.type === 'channel' || item.type === 'playlist'
      })
      this.$store.commit('setPopularCache', returnData)
      return returnData
    },

    getTrendingInfo: async function () {
      this.isLoading = true
      let data = this.popularCache
      if (!data || data.length < 1) {
        data = await this.fetchTrendingInfo()
      }
      if (!data) {
        return
      }

      this.shownResults = this.shownResults.concat(data)
      this.isLoading = false
    }
  }
})
