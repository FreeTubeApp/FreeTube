import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtSlider from '../ft-slider/ft-slider.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import { colors } from '../../helpers/colors'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'

export default defineComponent({
  name: 'ThemeSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-select': FtSelect,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-slider': FtSlider,
    'ft-flex-box': FtFlexBox,
    'ft-icon-button': FtIconButton,
    'ft-prompt': FtPrompt
  },
  data: function () {
    return {
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
        'system',
        'light',
        'dark',
        'black',
        'dracula',
        'catppuccinMocha',
        'pastelPink',
        'hotPink'
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
        this.$t('Yes'),
        this.$t('No')
      ]
    },

    baseThemeNames: function () {
      return [
        this.$t('Settings.Theme Settings.Base Theme.System Default'),
        this.$t('Settings.Theme Settings.Base Theme.Light'),
        this.$t('Settings.Theme Settings.Base Theme.Dark'),
        this.$t('Settings.Theme Settings.Base Theme.Black'),
        this.$t('Settings.Theme Settings.Base Theme.Dracula'),
        this.$t('Settings.Theme Settings.Base Theme.Catppuccin Mocha'),
        this.$t('Settings.Theme Settings.Base Theme.Pastel Pink'),
        this.$t('Settings.Theme Settings.Base Theme.Hot Pink')
      ]
    },

    colorValues: function () {
      return colors.map(color => color.name)
    },

    colorNames: function () {
      return this.colorValues.map(colorVal => {
        // add spaces before capital letters
        const colorName = colorVal.replaceAll(/([A-Z])/g, ' $1').trim()
        return this.$t(`Settings.Theme Settings.Main Color Theme.${colorName}`)
      })
    },

    areColorThemesEnabled: function() {
      return this.baseTheme !== 'hotPink'
    },

    usingElectron: function () {
      return process.env.IS_ELECTRON
    },

    subscriptionListOptions: function () {
      return this.$store.getters.getSubscriptionListOptions
    },

    profileListOptions: function () {
      return this.$store.getters.getProfileListOptions
    },

    settingsSectionListOptions: function () {
      return this.$store.getters.getSettingsSectionListOptions
    },

    subscriptionListDisplayDropdownOptions: function () {
      return this.listDisplayDropdownOptions(this.subscriptionListOptions, false)
    },

    profileListDisplayDropdownOptions: function () {
      return this.listDisplayDropdownOptions(this.profileListOptions, false)
    },

    settingsSectionListDisplayDropdownOptions: function () {
      return this.listDisplayDropdownOptions(this.settingsSectionListOptions, true)
    },
  },
  mounted: function () {
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

      if (value === null || value === 'no') {
        this.disableSmoothScrollingToggleValue = !this.disableSmoothScrollingToggleValue
        return
      }

      this.updateDisableSmoothScrolling(
        this.disableSmoothScrollingToggleValue
      ).then(() => {
        const { ipcRenderer } = require('electron')
        ipcRenderer.send('relaunchRequest')
      })
    },

    handleSubscriptionListDisplayDropdownOptionClick: function (option) {
      const newListOptions = this.getNewListOptions(this.subscriptionListOptions, option)
      this.updateSubscriptionListOptions(newListOptions)
    },

    handleProfileListDisplayDropdownOptionClick: function (option) {
      const newListOptions = this.getNewListOptions(this.profileListOptions, option)
      this.updateProfileListOptions(newListOptions)
    },

    handleSettingsSectionListDisplayDropdownOptionClick: function (option) {
      const newListOptions = this.getNewListOptions(this.settingsSectionListOptions, option)
      this.updateSettingsSectionListOptions(newListOptions)
    },

    getNewListOptions: function(list, option) {
      switch (option) {
        case 'defaultSort':
        case 'alphabeticalAscending':
        case 'alphabeticalDescending':
          return {
            ...list,
            sort: option
          }
        case 'showGridItemTitles':
        case 'hideGridItemTitles':
          return {
            ...list,
            showGridItemTitles: option === 'showGridItemTitles'
          }
        case 'list':
        case 'grid':
          return {
            ...list,
            displayType: option
          }
        default:
          return {
            ...list,
            itemsPerGridRow: option
          }
      }
    },

    listDisplayDropdownOptions: function (listOptions, showDefaultOption) {
      const radioGroupSort = []
      const options = [
        {
          type: 'radiogroup',
          radios: radioGroupSort
        }
      ]
      if (showDefaultOption) {
        radioGroupSort.push(
          {
            type: 'checkbox',
            label: this.$t('Settings.List Display Settings.Sort.Use default sort'),
            value: 'defaultSort',
            checked: listOptions.sort === 'defaultSort',
          }
        )
      }

      radioGroupSort.push(
        {
          type: 'checkbox',
          label: this.$t('Settings.List Display Settings.Sort.Sort by title (A to Z)'),
          value: 'alphabeticalAscending',
          checked: listOptions.sort === 'alphabeticalAscending',
        }
      )

      if (!showDefaultOption) {
        radioGroupSort.push(
          {
            type: 'checkbox',
            label: this.$t('Settings.List Display Settings.Sort.Sort by title (Z to A)'),
            value: 'alphabeticalDescending',
            checked: listOptions.sort === 'alphabeticalDescending',
          }
        )
      }

      if (listOptions.displayType) {
        const radioGroupDisplayType = []
        options.push(
          {
            type: 'radiogroup',
            radios: radioGroupDisplayType
          }
        )
        radioGroupDisplayType.push(
          {
            type: 'divider'
          },
          {
            type: 'checkbox',
            label: this.$t('Settings.List Display Settings.Display Type.List'),
            value: 'list',
            checked: listOptions.displayType === 'list',
          },
          {
            type: 'checkbox',
            label: this.$t('Settings.List Display Settings.Display Type.Grid.Grid'),
            value: 'grid',
            checked: listOptions.displayType === 'grid',
          }
        )

        if (listOptions.displayType === 'grid') {
          const radioGroupItemsPerGridRow = []
          options.push(
            {
              type: 'radiogroup',
              radios: radioGroupItemsPerGridRow
            }
          )

          radioGroupItemsPerGridRow.push(
            {
              type: 'divider'
            }
          )

          for (let i = 2; i <= 5; ++i) {
            radioGroupItemsPerGridRow.push({
              type: 'checkbox',
              label: this.$tc('Settings.List Display Settings.Display Type.Grid.Item per grid row', i, { number: i }),
              value: i,
              checked: listOptions.itemsPerGridRow === i
            })
          }

          const radioGroupShowGridItemTitles = []
          options.push(
            {
              type: 'radiogroup',
              radios: radioGroupShowGridItemTitles
            }
          )
          radioGroupShowGridItemTitles.push(
            {
              type: 'divider'
            },
            {
              type: 'checkbox',
              label: this.$t('Settings.List Display Settings.Display Type.Grid.Show grid item titles'),
              value: 'showGridItemTitles',
              checked: listOptions.showGridItemTitles
            },
            {
              type: 'checkbox',
              label: this.$t('Settings.List Display Settings.Display Type.Grid.Hide grid item titles'),
              value: 'hideGridItemTitles',
              checked: !listOptions.showGridItemTitles,
            }
          )
        }
      }

      return options
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
      'updateHideHeaderLogo',
      'updateSubscriptionListSort',
      'updateSubscriptionListOptions',
      'updateProfileListOptions',
      'updateSettingsSectionListOptions'
    ])
  }
})
