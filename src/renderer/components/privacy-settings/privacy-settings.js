import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtButton from '../FtButton/FtButton.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'
import FtSelect from '../ft-select/ft-select.vue'
import { MAIN_PROFILE_ID } from '../../../constants'
import { showToast } from '../../helpers/utils'

export default defineComponent({
  name: 'PrivacySettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-button': FtButton,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt,
    'ft-select': FtSelect,
  },
  data: function () {
    return {
      showSearchCachePrompt: false,
      showRemoveHistoryPrompt: false,
      showRemoveSubscriptionsPrompt: false,
      showRemovePlaylistsPrompt: false,
      promptValues: [
        'delete',
        'cancel'
      ],
      watchedProgressSavingModeValues: [
        'auto',
        'semi-auto',
        'never',
      ],
    }
  },
  computed: {
    rememberSearchHistory: function () {
      return this.$store.getters.getRememberSearchHistory
    },
    rememberHistory: function () {
      return this.$store.getters.getRememberHistory
    },
    watchedProgressSavingMode() {
      return this.$store.getters.getWatchedProgressSavingMode
    },
    watchedProgressSavingModeNames() {
      return [
        this.$t('Settings.Privacy Settings.Watched Progress Saving Mode.Modes.Auto'),
        this.$t('Settings.Privacy Settings.Watched Progress Saving Mode.Modes.Semi-auto'),
        this.$t('Settings.Privacy Settings.Watched Progress Saving Mode.Modes.Never'),
      ]
    },
    saveVideoHistoryWithLastViewedPlaylist: function () {
      return this.$store.getters.getSaveVideoHistoryWithLastViewedPlaylist
    },

    profileList: function () {
      return this.$store.getters.getProfileList
    },
    removeSubscriptionsPromptMessage: function () {
      return this.$t('Settings.Privacy Settings["Are you sure you want to remove all subscriptions and profiles?  This cannot be undone."]')
    },
    promptNames: function () {
      return [
        this.$t('Yes, Delete'),
        this.$t('Cancel')
      ]
    }
  },
  methods: {
    handleSearchCache: function (option) {
      this.showSearchCachePrompt = false

      if (option !== 'delete') { return }

      this.clearSessionSearchHistory()
      this.removeAllSearchHistoryEntries()
      showToast(this.$t('Settings.Privacy Settings.Search history and cache have been cleared'))
    },

    handleRememberHistory: function (value) {
      if (!value) {
        this.updateWatchedProgressSavingMode('never')
      }

      this.updateRememberHistory(value)
    },

    handleRemoveHistory: function (option) {
      this.showRemoveHistoryPrompt = false

      if (option !== 'delete') { return }

      this.removeAllHistory()
      showToast(this.$t('Settings.Privacy Settings.Watch history has been cleared'))
    },

    handleRemoveSubscriptions: function (option) {
      this.showRemoveSubscriptionsPrompt = false

      this.updateActiveProfile(MAIN_PROFILE_ID)

      if (option !== 'delete') { return }

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

      this.clearSubscriptionsCache()
    },

    handleRemovePlaylists: function (option) {
      this.showRemovePlaylistsPrompt = false

      if (option !== 'delete') { return }

      this.removeAllPlaylists()
      this.updateQuickBookmarkTargetPlaylistId('favorites')
      showToast(this.$t('Settings.Privacy Settings.All playlists have been removed'))
    },

    ...mapActions([
      'updateRememberHistory',
      'removeAllHistory',
      'updateRememberSearchHistory',
      'updateWatchedProgressSavingMode',
      'updateSaveVideoHistoryWithLastViewedPlaylist',
      'clearSessionSearchHistory',
      'removeAllSearchHistoryEntries',
      'updateProfile',
      'removeProfile',
      'updateActiveProfile',
      'clearSubscriptionsCache',
      'updateAllSubscriptionsList',
      'updateProfileSubscriptions',
      'removeAllPlaylists',
      'updateQuickBookmarkTargetPlaylistId',
    ])
  }
})
