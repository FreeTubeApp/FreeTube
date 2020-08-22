import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'

export default Vue.extend({
  name: 'PrivacySettings',
  components: {
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt
  },
  data: function () {
    return {
      showSearchCachePrompt: false,
      showRemoveHistoryPrompt: false,
      promptValues: [
        'yes',
        'no'
      ]
    }
  },
  computed: {
    rememberHistory: function () {
      return this.$store.getters.getRememberHistory
    },
    saveWatchedProgress: function () {
      return this.$store.getters.getSaveWatchedProgress
    },
    promptNames: function () {
      return [
        this.$t('Yes'),
        this.$t('No')
      ]
    }
  },
  methods: {
    handleSearchCache: function (option) {
      this.showSearchCachePrompt = false

      if (option === 'yes') {
        this.clearSessionSearchHistory()
        this.showToast({
          message: this.$t('Settings.Privacy Settings.Search cache has been cleared')
        })
      }
    },

    handleRemoveHistory: function (option) {
      this.showRemoveHistoryPrompt = false

      if (option === 'yes') {
        this.removeAllHistory()
        this.showToast({
          message: this.$t('Settings.Privacy Settings.Watch history has been cleared')
        })
      }
    },

    ...mapActions([
      'updateRememberHistory',
      'removeAllHistory',
      'updateSaveWatchedProgress',
      'clearSessionSearchHistory',
      'showToast'
    ])
  }
})
