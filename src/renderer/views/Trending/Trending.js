import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

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
  mounted: function () {
    this.getTrendingInfo()
  },
  methods: {
    getTrendingInfo: function () {
      this.isLoading = true

      const searchPayload = {
        resource: 'trending',
        id: '',
        params: {}
      }

      this.$store.dispatch('invidiousAPICall', searchPayload).then((result) => {
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
      })
    }
  }
})
