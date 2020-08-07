import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'ThemeSettings',
  components: {
    'ft-card': FtCard,
    'ft-select': FtSelect,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {
      currentBaseTheme: '',
      currentMainColor: '',
      currentSecColor: '',
      baseThemeValues: [
        'light',
        'dark',
        'black'
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
        'DeepOrange'
      ]
    }
  },
  computed: {
    barColor: function () {
      return this.$store.getters.getBarColor
    },

    baseThemeNames: function () {
      return [
        this.$t('Settings.Theme Settings.Base Theme.Light'),
        this.$t('Settings.Theme Settings.Base Theme.Dark'),
        this.$t('Settings.Theme Settings.Base Theme.Black')
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
        this.$t('Settings.Theme Settings.Main Color Theme.Deep Orange')
      ]
    }
  },
  mounted: function () {
    this.currentBaseTheme = localStorage.getItem('baseTheme')
    this.currentMainColor = localStorage.getItem('mainColor').replace('main', '')
    this.currentSecColor = localStorage.getItem('secColor').replace('sec', '')
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
      'updateBarColor'
    ])
  }
})
