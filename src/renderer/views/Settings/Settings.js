import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import GeneralSettings from '../../components/GeneralSettings/GeneralSettings.vue'
import ThemeSettings from '../../components/ThemeSettings.vue'
import PlayerSettings from '../../components/PlayerSettings/PlayerSettings.vue'
import ExternalPlayerSettings from '../../components/ExternalPlayerSettings.vue'
import SubscriptionSettings from '../../components/SubscriptionSettings/SubscriptionSettings.vue'
import DownloadSettings from '../../components/DownloadSettings/DownloadSettings.vue'
import PrivacySettings from '../../components/PrivacySettings.vue'
import DataSettings from '../../components/DataSettings/DataSettings.vue'
import DistractionSettings from '../../components/DistractionSettings/DistractionSettings.vue'
import ProxySettings from '../../components/ProxySettings/ProxySettings.vue'
import SponsorBlockSettings from '../../components/SponsorBlockSettings.vue'
import ParentalControlSettings from '../../components/ParentalControlSettings.vue'
import ExperimentalSettings from '../../components/ExperimentalSettings/ExperimentalSettings.vue'
import PasswordSettings from '../../components/PasswordSettings/PasswordSettings.vue'
import PasswordDialog from '../../components/PasswordDialog/PasswordDialog.vue'
import FtToggleSwitch from '../../components/FtToggleSwitch/FtToggleSwitch.vue'
import FtButton from '../../components/FtButton/FtButton.vue'
import FtSettingsMenu from '../../components/FtSettingsMenu/FtSettingsMenu.vue'

const ACTIVE_CLASS_NAME = 'active'
const SETTINGS_MOBILE_WIDTH_THRESHOLD = 1015

export default defineComponent({
  name: 'Settings',
  components: {
    'general-settings': GeneralSettings,
    'theme-settings': ThemeSettings,
    'player-settings': PlayerSettings,
    'subscription-settings': SubscriptionSettings,
    'privacy-settings': PrivacySettings,
    'data-settings': DataSettings,
    'distraction-settings': DistractionSettings,
    'sponsor-block-settings': SponsorBlockSettings,
    'parental-control-settings': ParentalControlSettings,
    'password-settings': PasswordSettings,
    'password-dialog': PasswordDialog,
    'ft-button': FtButton,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-settings-menu': FtSettingsMenu,
    ...(process.env.IS_ELECTRON
      ? {
          'proxy-settings': ProxySettings,
          'download-settings': DownloadSettings,
          'external-player-settings': ExternalPlayerSettings,
          'experimental-settings': ExperimentalSettings
        }
      : {})
  },
  data: function () {
    return {
      usingElectron: process.env.IS_ELECTRON,
      isInDesktopView: true,
      settingsSectionTypeOpenInMobile: null,
      unlocked: false
    }
  },
  computed: {
    locale: function() {
      return this.$i18n.locale
    },

    settingsPassword: function () {
      return this.$store.getters.getSettingsPassword
    },

    settingsSectionSortEnabled: function () {
      return this.$store.getters.getSettingsSectionSortEnabled
    },

    settingsComponentsData: function () {
      const settingsComponentsData = [
        {
          type: 'theme-settings',
          title: this.$t('Settings.Theme Settings.Theme Settings'),
          icon: 'display'
        },
        {
          type: 'player-settings',
          title: this.$t('Settings.Player Settings.Player Settings'),
          icon: 'circle-play'
        },
        ...(process.env.IS_ELECTRON
          ? [{
              type: 'external-player-settings',
              title: this.$t('Settings.External Player Settings.External Player Settings'),
              icon: 'clapperboard'
            }]
          : []),
        {
          type: 'subscription-settings',
          title: this.$t('Settings.Subscription Settings.Subscription Settings'),
          icon: 'play'
        },
        {
          type: 'distraction-settings',
          title: this.$t('Settings.Distraction Free Settings.Distraction Free Settings'),
          icon: 'eye-slash'
        },
        {
          type: 'parental-control-settings',
          title: this.$t('Settings.Parental Control Settings.Parental Control Settings'),
          icon: 'user-lock'
        },
        {
          type: 'privacy-settings',
          title: this.$t('Settings.Privacy Settings.Privacy Settings'),
          icon: 'lock'
        },
        {
          type: 'data-settings',
          title: this.$t('Settings.Data Settings.Data Settings'),
          icon: 'database'
        },
        ...(process.env.IS_ELECTRON
          ? [
              {
                type: 'proxy-settings',
                title: this.$t('Settings.Proxy Settings.Proxy Settings'),
                icon: 'network-wired',
              },
              {
                type: 'download-settings',
                title: this.$t('Settings.Download Settings.Download Settings'),
                icon: 'download',
              }
            ]
          : []),
        {
          type: 'sponsor-block-settings',
          title: this.$t('Settings.SponsorBlock Settings.SponsorBlock Settings'),
          // TODO: replace with SponsorBlock icon
          icon: 'shield'
        },
        {
          type: 'password-settings',
          title: this.$t('Settings.Password Settings.Password Settings'),
          icon: 'key'
        },
        ...(process.env.IS_ELECTRON
          ? [{
              type: 'experimental-settings',
              title: this.$t('Settings.Experimental Settings.Experimental Settings'),
              icon: 'flask'
            }]
          : []),
      ]
      return settingsComponentsData
    },

    settingsSectionComponents: function () {
      let settingsSections = this.settingsComponentsData
      if (this.settingsSectionSortEnabled) {
        settingsSections = settingsSections.toSorted((a, b) => {
          return a.title.toLowerCase().localeCompare(b.title.toLowerCase(), this.locale)
        })
      }

      // ensure General Settings is placed first regardless of sorting
      const generalSettingsEntry = {
        type: 'general-settings',
        title: this.$t('Settings.General Settings.General Settings'),
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
    if (this.unlocked) {
      this.handleMounted()
    }
  },
  beforeUnmount: function () {
    document.removeEventListener('scroll', this.markScrolledToSectionAsActive)
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleMounted: function () {
      this.handleResize()
      window.addEventListener('resize', this.handleResize)
      document.addEventListener('scroll', this.markScrolledToSectionAsActive)

      // mark first section as active before any scrolling has taken place
      if (this.settingsSectionComponents.length > 0) {
        const firstSection = document.getElementById(this.settingsSectionComponents[0].type)
        firstSection.classList.add(ACTIVE_CLASS_NAME)
      }
    },

    handleUnlock: function () {
      this.unlocked = true

      nextTick(() => {
        this.handleMounted()
      })
    },

    navigateToSection: function(sectionType) {
      if (this.isInDesktopView) {
        nextTick(() => {
          const sectionElement = this.$refs[sectionType][0].$el
          sectionElement.scrollIntoView()

          const sectionHeading = sectionElement.firstChild.firstChild
          sectionHeading.tabIndex = 0
          sectionHeading.focus()
          sectionHeading.tabIndex = -1
        })
      } else {
        this.settingsSectionTypeOpenInMobile = sectionType
      }
    },

    returnToSettingsMenu: function () {
      const openSection = this.settingsSectionTypeOpenInMobile
      this.settingsSectionTypeOpenInMobile = null

      // focus the corresponding Settings Menu title
      nextTick(() => document.getElementById(openSection)?.focus())
    },

    /* Set the current section to be shown as active in the Settings Menu
    * if it is the lowest section within the top quarter of the viewport (25vh) */
    markScrolledToSectionAsActive: function() {
      const scrollY = window.scrollY + innerHeight / 4
      this.settingsSectionComponents.forEach((section) => {
        const sectionElement = this.$refs[section.type][0].$el
        const sectionHeight = sectionElement.offsetHeight
        const sectionTop = sectionElement.offsetTop
        const correspondingMenuLink = document.getElementById(section.type)

        if (this.isInDesktopView && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          correspondingMenuLink.classList.add(ACTIVE_CLASS_NAME)
        } else {
          correspondingMenuLink.classList.remove(ACTIVE_CLASS_NAME)
        }
      })
    },

    handleResize: function () {
      const wasNotInDesktopView = !this.isInDesktopView
      this.isInDesktopView = window.innerWidth > SETTINGS_MOBILE_WIDTH_THRESHOLD

      // navigate to section that was open in mobile or desktop view, if any
      if (this.isInDesktopView && wasNotInDesktopView && this.settingsSectionTypeOpenInMobile != null) {
        this.navigateToSection(this.settingsSectionTypeOpenInMobile)
        this.settingsSectionTypeOpenInMobile = null
      } else if (!this.isInDesktopView && !wasNotInDesktopView) {
        const activeMenuLink = document.querySelector(`.settingsMenu .title.${ACTIVE_CLASS_NAME}`)
        if (!activeMenuLink) {
          return
        }

        const sectionType = activeMenuLink.id
        this.navigateToSection(sectionType)
      }
    },

    ...mapActions([
      'showKeyboardShortcutPrompt',
      'updateSettingsSectionSortEnabled'
    ])
  }
})
