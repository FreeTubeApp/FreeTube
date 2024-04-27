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
import FtSettingsMenu from '../../components/ft-settings-menu/ft-settings-menu.vue'
import { ACTIVE_CLASS_NAME } from '../../../constants'

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
    'ft-toggle-switch': FtToggleSwitch,
    'ft-settings-menu': FtSettingsMenu,
  },
  data: function () {
    return {
      unlocked: false
    }
  },
  computed: {
    locale: function() {
      return this.$i18n.locale.replace('_', '-')
    },

    settingsPassword: function () {
      return this.$store.getters.getSettingsPassword
    },

    settingsSectionSortEnabled: function () {
      return this.$store.getters.getSettingsSectionSortEnabled
    },

    settingsComponentsData: function () {
      return [
        {
          type: 'theme-settings',
          title: this.$t('Settings.Theme Settings.Theme Settings'),
          shortTitle: this.$te('Settings.Theme Settings.Theme Settings Short Label') ? this.$t('Settings.Theme Settings.Theme Settings Short Label') : '',
          icon: 'display'
        },
        {
          type: 'player-settings',
          title: this.$t('Settings.Player Settings.Player Settings'),
          shortTitle: this.$te('Settings.Player Settings.Player Settings Short Label') ? this.$t('Settings.Player Settings.Player Settings Short Label') : '',
          icon: 'circle-play'
        },
        {
          type: 'external-player-settings',
          title: this.$t('Settings.External Player Settings.External Player Settings'),
          shortTitle: this.$te('Settings.External Player Settings.External Player') ? this.$t('Settings.External Player Settings.External Player') : '',
          icon: 'clapperboard',
          usingElectron: true
        },
        {
          type: 'subscription-settings',
          title: this.$t('Settings.Subscription Settings.Subscription Settings'),
          shortTitle: this.$te('Settings.Subscription Settings.Subscription Settings Short Label') ? this.$t('Settings.Subscription Settings.Subscription Settings Short Label') : '',
          icon: 'play'
        },
        {
          type: 'distraction-settings',
          title: this.$t('Settings.Distraction Free Settings.Distraction Free Settings'),
          shortTitle: this.$te('Settings.Distraction Free Settings.Distraction Free Settings Short Label') ? this.$t('Settings.Distraction Free Settings.Distraction Free Settings Short Label') : '',
          icon: 'eye-slash'
        },
        {
          type: 'privacy-settings',
          title: this.$t('Settings.Privacy Settings.Privacy Settings'),
          shortTitle: this.$te('Settings.Privacy Settings.Privacy Settings Short Label') ? this.$t('Settings.Privacy Settings.Privacy Settings Short Label') : '',
          icon: 'lock'
        },
        {
          type: 'data-settings',
          title: this.$t('Settings.Data Settings.Data Settings'),
          shortTitle: this.$te('Settings.Data Settings.Data Settings Short Label') ? this.$t('Settings.Data Settings.Data Settings Short Label') : '',
          icon: 'database'
        },
        {
          type: 'proxy-settings',
          title: this.$t('Settings.Proxy Settings.Proxy Settings'),
          shortTitle: this.$te('Settings.Proxy Settings.Proxy Settings Short Label') ? this.$t('Settings.Proxy Settings.Proxy Settings Short Label') : '',
          icon: 'network-wired',
          usingElectron: true
        },
        {
          type: 'download-settings',
          title: this.$t('Settings.Download Settings.Download Settings'),
          shortTitle: this.$te('Settings.Download Settings.Download Settings Short Label') ? this.$t('Settings.Download Settings.Download Settings Short Label') : '',
          icon: 'download',
          usingElectron: true
        },
        {
          type: 'parental-control-settings',
          title: this.$t('Settings.Parental Control Settings.Parental Control Settings'),
          shortTitle: this.$te('Settings.Parental Control Settings.Parental Control Settings Short Label') ? this.$t('Settings.Parental Control Settings.Parental Control Settings Short Label') : '',
          icon: 'user-lock'
        },
        {
          type: 'sponsor-block-settings',
          title: this.$t('Settings.SponsorBlock Settings.SponsorBlock Settings'),
          shortTitle: this.$te('Settings.SponsorBlock Settings.SponsorBlock Settings Short Label') ? this.$t('Settings.SponsorBlock Settings.SponsorBlock Settings Short Label') : '',
          // TODO: replace with SponsorBlock icon
          icon: 'shield'
        },
        {
          type: 'experimental-settings',
          title: this.$t('Settings.Experimental Settings.Experimental Settings'),
          shortTitle: this.$te('Settings.Experimental Settings.Experimental Settings Short Label') ? this.$t('Settings.Experimental Settings.Experimental Settings Short Label') : '',
          icon: 'flask',
          usingElectron: true
        },
        {
          type: 'password-settings',
          title: this.$t('Settings.Password Settings.Password Settings'),
          shortTitle: this.$te('Settings.Password Settings.Password Settings Short Label') ? this.$t('Settings.Password Settings.Password Settings Short Label') : '',
          icon: 'key'
        },
      ]
    },

    settingsSectionComponents: function () {
      let settingsSections
      if (!process.env.IS_ELECTRON) {
        settingsSections = this.settingsComponentsData.filter((settingsComponent) => !settingsComponent.usingElectron)
      } else {
        settingsSections = this.settingsComponentsData
      }

      if (this.settingsSectionSortEnabled) {
        settingsSections = settingsSections.toSorted((a, b) => {
          const aTitle = a.shortTitle !== '' ? a.shortTitle : a.title
          const bTitle = b.shortTitle !== '' ? b.shortTitle : b.title
          return aTitle.toLowerCase().localeCompare(bTitle.toLowerCase(), this.locale)
        })
      }

      // ensure General Settings is placed first regardless of sorting
      const generalSettingsEntry = {
        type: 'general-settings',
        title: this.$t('Settings.General Settings.General Settings'),
        shortTitle: this.$te('Settings.General Settings.General Settings Short Label') ? this.$t('Settings.General Settings.General Settings Short Label') : '',
        icon: 'border-all'
      }

      return [generalSettingsEntry, ...settingsSections]
    },
  },
  created: function () {
    if (this.settingsPassword === '') {
      this.unlocked = true
    }
  },
  mounted: function () {
    document.addEventListener('scroll', this.markScrolledToSectionAsActive)

    // mark first section as active before any scrolling has taken place
    if (this.settingsSectionComponents.length > 0) {
      const firstSection = document.getElementById(`${this.settingsSectionComponents[0].type}-link`)
      firstSection.classList.add(ACTIVE_CLASS_NAME)
    }
  },
  beforeDestroy: function () {
    document.removeEventListener('scroll', this.markScrolledToSectionAsActive)
  },
  methods: {
    /* Set the current section to be shown as active in the Settings Menu
    * if it is the lowest section within the top quarter of the viewport (25vh) */
    markScrolledToSectionAsActive: function() {
      const scrollY = window.scrollY + innerHeight / 4
      this.settingsSectionComponents.forEach((section) => {
        const sectionElement = document.getElementById(section.type)
        const sectionHeight = sectionElement.offsetHeight
        const sectionTop = sectionElement.offsetTop
        const correspondingMenuLink = document.getElementById(`${section.type}-link`)

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          correspondingMenuLink.classList.add(ACTIVE_CLASS_NAME)
        } else {
          correspondingMenuLink.classList.remove(ACTIVE_CLASS_NAME)
        }
      })
    },

    ...mapActions([
      'updateSettingsSectionSortEnabled'
    ])
  }
})
