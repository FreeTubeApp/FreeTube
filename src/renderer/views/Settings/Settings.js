import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import GeneralSettings from '../../components/general-settings/general-settings.vue'
import ThemeSettings from '../../components/theme-settings/theme-settings.vue'
import PlayerSettings from '../../components/player-settings/player-settings.vue'
import ExternalPlayerSettings from '../../components/external-player-settings/external-player-settings.vue'
import SubscriptionSettings from '../../components/subscription-settings/subscription-settings.vue'
import DownloadSettings from '../../components/download-settings/download-settings.vue'
import PrivacySettings from '../../components/privacy-settings/privacy-settings.vue'
import DataSettings from '../../components/data-settings/data-settings.vue'
import DistractionSettings from '../../components/distraction-settings/distraction-settings.vue'
import ProxySettings from '../../components/proxy-settings/proxy-settings.vue'
import SponsorBlockSettings from '../../components/sponsor-block-settings/sponsor-block-settings.vue'
import ParentControlSettings from '../../components/parental-control-settings/parental-control-settings.vue'
import ExperimentalSettings from '../../components/experimental-settings/experimental-settings.vue'
import PasswordSettings from '../../components/password-settings/password-settings.vue'
import PasswordDialog from '../../components/password-dialog/password-dialog.vue'
import FtToggleSwitch from '../../components/ft-toggle-switch/ft-toggle-switch.vue'

export default defineComponent({
  name: 'Settings',
  components: {
    'general-settings': GeneralSettings,
    'theme-settings': ThemeSettings,
    'player-settings': PlayerSettings,
    'external-player-settings': ExternalPlayerSettings,
    'subscription-settings': SubscriptionSettings,
    'privacy-settings': PrivacySettings,
    'data-settings': DataSettings,
    'distraction-settings': DistractionSettings,
    'proxy-settings': ProxySettings,
    'sponsor-block-settings': SponsorBlockSettings,
    'download-settings': DownloadSettings,
    'parental-control-settings': ParentControlSettings,
    'experimental-settings': ExperimentalSettings,
    'password-settings': PasswordSettings,
    'password-dialog': PasswordDialog,
    'ft-toggle-switch': FtToggleSwitch
  },
  data: function () {
    return {
      unlocked: false,
      settingsComponentsData: [
        {
          type: 'general-settings',
          title: this.$t('Settings.General Settings.General Settings')
        },
        {
          type: 'theme-settings',
          title: this.$t('Settings.Theme Settings.Theme Settings')
        },
        {
          type: 'player-settings',
          title: this.$t('Settings.Player Settings.Player Settings')
        },
        {
          type: 'external-player-settings',
          title: this.$t('Settings.External Player Settings.External Player Settings'),
          usingElectron: true
        },
        {
          type: 'subscription-settings',
          title: this.$t('Settings.Subscription Settings.Subscription Settings')
        },
        {
          type: 'distraction-settings',
          title: this.$t('Settings.Distraction Free Settings.Distraction Free Settings')
        },
        {
          type: 'privacy-settings',
          title: this.$t('Settings.Privacy Settings.Privacy Settings')
        },
        {
          type: 'data-settings',
          title: this.$t('Settings.Data Settings.Data Settings')
        },
        {
          type: 'proxy-settings',
          title: this.$t('Settings.Proxy Settings.Proxy Settings'),
          usingElectron: true
        },
        {
          type: 'download-settings',
          title: this.$t('Settings.Download Settings.Download Settings'),
          usingElectron: true
        },
        {
          type: 'parental-control-settings',
          title: this.$t('Settings.Parental Control Settings.Parental Control Settings')
        },
        {
          type: 'sponsor-block-settings',
          title: this.$t('Settings.SponsorBlock Settings.SponsorBlock Settings'),
        },
        {
          type: 'experimental-settings',
          title: this.$t('Settings.Experimental Settings.Experimental Settings'),
          usingElectron: true
        },
        {
          type: 'password-settings',
          title: this.$t('Settings.Password Settings.Password Settings')
        },
      ]
    }
  },
  computed: {
    locale: function() {
      return this.$i18n.locale.replace('_', '-')
    },

    settingsPassword: function () {
      return this.$store.getters.getSettingsPassword
    },

    allSettingsSectionsExpandedByDefault: function () {
      return this.$store.getters.getAllSettingsSectionsExpandedByDefault
    },

    settingsSectionSortEnabled: function () {
      return this.$store.getters.getSettingsSectionSortEnabled
    },

    settingsSectionComponents: function () {
      let settingsSections
      if (!process.env.IS_ELECTRON) {
        settingsSections = this.settingsComponentsData.filter((settingsComponent) => !settingsComponent.usingElectron)
      } else {
        settingsSections = this.settingsComponentsData
      }

      if (this.settingsSectionSortEnabled) {
        return settingsSections.toSorted((a, b) =>
          a.title.toLowerCase().localeCompare(b.title.toLowerCase(), this.locale)
        )
      }

      return settingsSections
    },
  },
  created: function () {
    if (this.settingsPassword === '') {
      this.unlocked = true
    }
  },
  methods: {
    ...mapActions([
      'updateAllSettingsSectionsExpandedByDefault',
      'updateSettingsSectionSortEnabled'
    ])
  }
})
