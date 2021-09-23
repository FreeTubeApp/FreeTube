import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtSlider from '../ft-slider/ft-slider.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'

export default Vue.extend({
  name: 'ThemeSettings',
  components: {
    'ft-card': FtCard,
    'ft-select': FtSelect,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-slider': FtSlider,
    'ft-flex-box': FtFlexBox,
    'ft-prompt': FtPrompt
  },
  data: function () {
    return {
      currentBaseTheme: '',
      currentMainColor: '',
      currentSecColor: '',
      expandSideBar: false,
      minUiScale: 50,
      maxUiScale: 300,
      uiScaleStep: 5,
      disableSmoothScrollingToggleValue: false,
      showRestartPrompt: false,
      restartPromptValues: [
        'yes',
        'no'
      ],
      baseThemeValues: [
        'light',
        'dark',
        'black',
        'dracula'
      ],
      colorValues: [
        'Red',
        'Pink',
        'Purple',
        'DeepPurple',
        'Indigo',
        'Blue',
        'LightBlue',
        'Cyan',
        'Teal',
        'Green',
        'LightGreen',
        'Lime',
        'Yellow',
        'Amber',
        'Orange',
        'DeepOrange',
        'DraculaCyan',
        'DraculaGreen',
        'DraculaOrange',
        'DraculaPink',
        'DraculaPurple',
        'DraculaRed',
        'DraculaYellow'
      ]
    }
  },
  computed: {
    barColor: function () {
      return this.$store.getters.getBarColor
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

    restartPromptMessage: function () {
      return this.$t('Settings["The app needs to restart for changes to take effect. Restart and apply change?"]')
    },

    restartPromptNames: function () {
      return [
        this.$t('Yes'),
        this.$t('No')
      ]
    },

    baseThemeNames: function () {
      return [
        this.$t('Settings.Theme Settings.Base Theme.Light'),
        this.$t('Settings.Theme Settings.Base Theme.Dark'),
        this.$t('Settings.Theme Settings.Base Theme.Black'),
        this.$t('Settings.Theme Settings.Base Theme.Dracula')
      ]
    },

    colorNames: function () {
      return [
        this.$t('Settings.Theme Settings.Main Color Theme.Red'),
        this.$t('Settings.Theme Settings.Main Color Theme.Pink'),
        this.$t('Settings.Theme Settings.Main Color Theme.Purple'),
        this.$t('Settings.Theme Settings.Main Color Theme.Deep Purple'),
        this.$t('Settings.Theme Settings.Main Color Theme.Indigo'),
        this.$t('Settings.Theme Settings.Main Color Theme.Blue'),
        this.$t('Settings.Theme Settings.Main Color Theme.Light Blue'),
        this.$t('Settings.Theme Settings.Main Color Theme.Cyan'),
        this.$t('Settings.Theme Settings.Main Color Theme.Teal'),
        this.$t('Settings.Theme Settings.Main Color Theme.Green'),
        this.$t('Settings.Theme Settings.Main Color Theme.Light Green'),
        this.$t('Settings.Theme Settings.Main Color Theme.Lime'),
        this.$t('Settings.Theme Settings.Main Color Theme.Yellow'),
        this.$t('Settings.Theme Settings.Main Color Theme.Amber'),
        this.$t('Settings.Theme Settings.Main Color Theme.Orange'),
        this.$t('Settings.Theme Settings.Main Color Theme.Deep Orange'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Cyan'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Green'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Orange'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Pink'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Purple'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Red'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Yellow')
      ]
    }
  },
  mounted: function () {
    this.currentBaseTheme = localStorage.getItem('baseTheme')
    this.currentMainColor = localStorage.getItem('mainColor').replace('main', '')
    this.currentSecColor = localStorage.getItem('secColor').replace('sec', '')
    this.expandSideBar = localStorage.getItem('expandSideBar') === 'true'
    this.disableSmoothScrollingToggleValue = this.disableSmoothScrolling
  },
  methods: {
    updateBaseTheme: function (theme) {
      const mainColor = `main${this.currentMainColor}`
      const secColor = `sec${this.currentSecColor}`

      const payload = {
        baseTheme: theme,
        mainColor: mainColor,
        secColor: secColor
      }

      this.$parent.$parent.updateTheme(payload)
      this.currentBaseTheme = theme
    },

    handleExpandSideBar: function (value) {
      if (this.isSideNavOpen !== value) {
        this.$store.commit('toggleSideNav')
      }

      this.expandSideBar = value
      localStorage.setItem('expandSideBar', value)
    },

    handleRestartPrompt: function (value) {
      this.disableSmoothScrollingToggleValue = value
      this.showRestartPrompt = true
    },

    handleSmoothScrolling: function (value) {
      this.showRestartPrompt = false

      if (value === null || value === 'no') {
        this.disableSmoothScrollingToggleValue = !this.disableSmoothScrollingToggleValue
        return
      }

      this.updateDisableSmoothScrolling(
        this.disableSmoothScrollingToggleValue
      ).then(() => {
        // FIXME: No electron safeguard
        const { ipcRenderer } = require('electron')

        ipcRenderer.send('relaunchRequest')
      })
    },

    updateMainColor: function (color) {
      const mainColor = `main${color}`
      const secColor = `sec${this.currentSecColor}`

      const payload = {
        baseTheme: this.currentBaseTheme,
        mainColor: mainColor,
        secColor: secColor
      }

      this.$parent.$parent.updateTheme(payload)
      this.currentMainColor = color
    },

    updateSecColor: function (color) {
      const mainColor = `main${this.currentMainColor}`
      const secColor = `sec${color}`

      const payload = {
        baseTheme: this.currentBaseTheme,
        mainColor: mainColor,
        secColor: secColor
      }

      this.$parent.$parent.updateTheme(payload)
      this.currentSecColor = color
    },

    ...mapActions([
      'updateBarColor',
      'updateUiScale',
      'updateDisableSmoothScrolling'
    ])
  }
})
