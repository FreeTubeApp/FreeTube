import { defineComponent } from 'vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'

import { invidiousAPICall } from '../../helpers/api/invidious'

export default defineComponent({
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
    document.addEventListener('keydown', this.keyboardShortcutHandler)

    this.shownResults = this.popularCache
    if (!this.shownResults || this.shownResults.length < 1) {
      this.fetchPopularInfo()
    }
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
  },
  methods: {
    fetchPopularInfo: async function () {
      const searchPayload = {
        resource: 'popular',
        id: '',
        params: {}
      }

      this.isLoading = true
      const result = await invidiousAPICall(searchPayload)
        .catch((err) => {
          console.error(err)
        })

      if (!result) {
        this.isLoading = false
        return
      }

      this.shownResults = result.filter((item) => {
        return item.type === 'video' || item.type === 'shortVideo' || item.type === 'channel' || item.type === 'playlist'
      })
      this.isLoading = false
      this.$store.commit('setPopularCache', this.shownResults)
    },

    // This function should always be at the bottom of this file
    keyboardShortcutHandler: function (event) {
      if (event.ctrlKey || document.activeElement.classList.contains('ft-input')) {
        return
      }
      switch (event.key) {
        case 'r':
        case 'R':
          if (!this.isLoading) {
            this.fetchPopularInfo()
          }
          break
      }
    }
  }
})
