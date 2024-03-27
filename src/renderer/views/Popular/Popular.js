import { defineComponent } from 'vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'

import { invidiousAPICall } from '../../helpers/api/invidious'
import { copyToClipboard, setPublishedTimestampsInvidious, showToast } from '../../helpers/utils'

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

    this.shownResults = this.popularCache || []
    if (!this.shownResults || this.shownResults.length < 1) {
      this.fetchPopularInfo()
    }
  },
  beforeUnmount: function () {
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
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          showToast(`${errorMessage}: ${err}`, 10000, () => {
            copyToClipboard(err)
          })
          return undefined
        })

      if (!result) {
        this.isLoading = false
        return
      }

      const items = result.filter((item) => {
        return item.type === 'video' || item.type === 'shortVideo' || item.type === 'channel' || item.type === 'playlist'
      })
      setPublishedTimestampsInvidious(items.filter(item => item.type === 'video' || item.type === 'shortVideo'))

      this.shownResults = items

      this.isLoading = false
      this.$store.commit('setPopularCache', items)
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
            this.fetchPopularInfo()
          }
          break
      }
    }
  }
})
