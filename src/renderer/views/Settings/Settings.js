import { defineComponent } from 'vue'
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
  },
  data: function () {
    return {
      unlocked: false
    }
  },
  computed: {
    usingElectron: function () {
      return process.env.IS_ELECTRON
    },

    settingsPassword: function () {
      return this.$store.getters.getSettingsPassword
    }
  },
  mounted: function () {
    if (this.settingsPassword === '') {
      this.unlocked = true
    }
  }
})
