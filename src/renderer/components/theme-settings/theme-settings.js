import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtSlider from '../ft-slider/ft-slider.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import { colors, getColorTranslations } from '../../helpers/colors'
import { IpcChannels } from '../../../constants'

export default defineComponent({
  name: 'ThemeSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-select': FtSelect,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-slider': FtSlider,
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt
  },
  data: function () {
    return {
      usingElectron: process.env.IS_ELECTRON,
      minUiScale: 50,
      maxUiScale: 300,
      uiScaleStep: 5,
      disableSmoothScrollingToggleValue: false,
      showRestartPrompt: false,
      restartPromptValues: [
        'restart',
        'cancel'
      ],
      /* Themes are devided into 3 groups. The first group contains the default themes. The second group are themes that don't have specific primary and secondary colors. The third group are themes that do have specific primary and secondary colors available. */
      baseThemeValues: [
        // First group
        'system',
        'light',
        'dark',
        'black',
        // Second group
        'nordic',
        'hotPink',
        'pastelPink',
        // Third group
        'catppuccinMocha',
        'dracula',
        'gruvboxDark',
        'gruvboxLight',
        'solarizedDark',
        'solarizedLight'
      ]
    }
  },
  computed: {
    barColor: function () {
      return this.$store.getters.getBarColor
    },

    baseTheme: function () {
      return this.$store.getters.getBaseTheme
    },

    mainColor: function () {
      return this.$store.getters.getMainColor
    },

    secColor: function () {
      return this.$store.getters.getSecColor
    },

    isSideNavOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    },

    uiScale: function () {
      return this.$store.getters.getUiScale
    },

    disableSmoothScrolling: function () {
      return this.$store.getters.getDisableSmoothScrolling
    },

    expandSideBar: function () {
      return this.$store.getters.getExpandSideBar
    },

    hideLabelsSideBar: function () {
      return this.$store.getters.getHideLabelsSideBar
    },

    hideHeaderLogo: function () {
      return this.$store.getters.getHideHeaderLogo
    },

    restartPromptMessage: function () {
      return this.$t('Settings["The app needs to restart for changes to take effect. Restart and apply change?"]')
    },

    restartPromptNames: function () {
      return [
        this.$t('Yes, Restart'),
        this.$t('Cancel')
      ]
    },

    /* Themes are devided into 3 groups. The first group contains the default themes. The second group are themes that don't have specific primary and secondary colors. The third group are themes that do have specific primary and secondary colors available. */
    baseThemeNames: function () {
      return [
        // First group
        this.$t('Settings.Theme Settings.Base Theme.System Default'),
        this.$t('Settings.Theme Settings.Base Theme.Light'),
        this.$t('Settings.Theme Settings.Base Theme.Dark'),
        this.$t('Settings.Theme Settings.Base Theme.Black'),
        // Second group
        this.$t('Settings.Theme Settings.Base Theme.Nordic'),
        this.$t('Settings.Theme Settings.Base Theme.Hot Pink'),
        this.$t('Settings.Theme Settings.Base Theme.Pastel Pink'),
        // Third group
        this.$t('Settings.Theme Settings.Base Theme.Catppuccin Mocha'),
        this.$t('Settings.Theme Settings.Base Theme.Dracula'),
        this.$t('Settings.Theme Settings.Base Theme.Gruvbox Dark'),
        this.$t('Settings.Theme Settings.Base Theme.Gruvbox Light'),
        this.$t('Settings.Theme Settings.Base Theme.Solarized Dark'),
        this.$t('Settings.Theme Settings.Base Theme.Solarized Light')
      ]
    },

    colorValues: function () {
      return colors.map(color => color.name)
    },

    colorNames: function () {
      return getColorTranslations()
    },

    areColorThemesEnabled: function() {
      return this.baseTheme !== 'hotPink'
    }
  },
  created: function () {
    this.disableSmoothScrollingToggleValue = this.disableSmoothScrolling
  },
  methods: {
    handleExpandSideBar: function (value) {
      if (this.isSideNavOpen !== value) {
        this.$store.commit('toggleSideNav')
      }

      this.updateExpandSideBar(value)
    },

    handleRestartPrompt: function (value) {
      this.disableSmoothScrollingToggleValue = value
      this.showRestartPrompt = true
    },

    handleSmoothScrolling: function (value) {
      this.showRestartPrompt = false

      if (value === null || value === 'cancel') {
        this.disableSmoothScrollingToggleValue = !this.disableSmoothScrollingToggleValue
        return
      }

      if (process.env.IS_ELECTRON) {
        this.updateDisableSmoothScrolling(
          this.disableSmoothScrollingToggleValue
        ).then(() => {
          const { ipcRenderer } = require('electron')
          ipcRenderer.send(IpcChannels.RELAUNCH_REQUEST)
        })
      }
    },

    ...mapActions([
      'updateBarColor',
      'updateBaseTheme',
      'updateMainColor',
      'updateSecColor',
      'updateExpandSideBar',
      'updateUiScale',
      'updateDisableSmoothScrolling',
      'updateHideLabelsSideBar',
      'updateHideHeaderLogo'
    ])
  }
})
