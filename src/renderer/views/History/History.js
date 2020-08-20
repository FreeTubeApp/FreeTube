import Vue from 'vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtButton from '../../components/ft-button/ft-button.vue'

export default Vue.extend({
  name: 'History',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-element-list': FtElementList,
    'ft-button': FtButton
  },
  data: function () {
    return {
      isLoading: false,
      dataLimit: 100
    }
  },
  computed: {
    historyCache: function () {
      return this.$store.getters.getHistoryCache
    },

    activeData: function () {
      if (this.historyCache.length < this.dataLimit) {
        return this.historyCache
      } else {
        return this.historyCache.slice(0, this.dataLimit)
      }
    }
  },
  watch: {
    historyCache() {
      this.isLoading = true
      setTimeout(() => {
        this.isLoading = false
      }, 100)
    }
  },
  mounted: function () {
    console.log(this.historyCache)

    const limit = sessionStorage.getItem('historyLimit')

    if (limit !== null) {
      this.dataLimit = limit
    }
  },
  methods: {
    increaseLimit: function () {
      this.dataLimit += 100
      sessionStorage.setItem('historyLimit', this.dataLimit)
    }
  }
})
