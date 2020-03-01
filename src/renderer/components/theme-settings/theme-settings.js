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
      title: 'Theme Settings',
      currentBaseTheme: '',
      currentMainColor: '',
      currentSecColor: '',
      baseThemeNames: [
        'Light',
        'Dark',
        'Gray'
      ],
      baseThemeValues: [
        'light',
        'dark',
        'gray'
      ],
      colorNames: [
        'Red',
        'Pink',
        'Purple',
        'Deep Purple',
        'Indigo',
        'Blue',
        'Light Blue',
        'Cyan',
        'Teal',
        'Green',
        'Light Green',
        'Lime',
        'Yellow',
        'Amber',
        'Orange',
        'Deep Orange'
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
