import Vue from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import { MAIN_PROFILE_ID } from '../../../constants'
import { showToast } from '../../helpers/utils'

export default Vue.extend({
  name: 'PrivacySettings',
  components: {
    'ft-settings-section': FtSettingsSection,
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
      showRemoveSubscriptionsPrompt: false,
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
    removeVideoMetaFiles: function () {
      return this.$store.getters.getRemoveVideoMetaFiles
    },

    profileList: function () {
      return this.$store.getters.getProfileList
    },
    removeSubscriptionsPromptMessage: function () {
      return this.$t('Settings.Privacy Settings["Are you sure you want to remove all subscriptions and profiles?  This cannot be undone."]')
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
        showToast(this.$t('Settings.Privacy Settings.Search cache has been cleared'))
      }
    },

    handleRememberHistory: function (value) {
      if (!value) {
        this.updateSaveWatchedProgress(false)
      }

      this.updateRememberHistory(value)
    },

    handleVideoMetaFiles: function (value) {
      if (!value) {
        this.updateRemoveVideoMetaFiles(false)
      }
      this.updateRemoveVideoMetaFiles(value)
    },

    handleRemoveHistory: function (option) {
      this.showRemoveHistoryPrompt = false

      if (option === 'yes') {
        this.removeAllHistory()
        showToast(this.$t('Settings.Privacy Settings.Watch history has been cleared'))
      }
    },

    handleRemoveSubscriptions: function (option) {
      this.showRemoveSubscriptionsPrompt = false

      this.updateActiveProfile(MAIN_PROFILE_ID)

      if (option === 'yes') {
        this.profileList.forEach((profile) => {
          if (profile._id === MAIN_PROFILE_ID) {
            const newProfile = {
              _id: MAIN_PROFILE_ID,
              name: profile.name,
              bgColor: profile.bgColor,
              textColor: profile.textColor,
              subscriptions: []
            }
            this.updateProfile(newProfile)
          } else {
            this.removeProfile(profile._id)
          }
        })
      }
    },

    ...mapActions([
      'updateRememberHistory',
      'updateRemoveVideoMetaFiles',
      'removeAllHistory',
      'updateSaveWatchedProgress',
      'clearSessionSearchHistory',
      'updateProfile',
      'removeProfile',
      'updateActiveProfile'
    ])
  }
})
