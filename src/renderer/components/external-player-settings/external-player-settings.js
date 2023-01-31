import { defineComponent } from 'vue'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import { useSettingsStore, useUtilsStore } from '../../stores'

export default defineComponent({
  name: 'ExternalPlayerSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox
  },
  setup() {
    const settingsStore = useSettingsStore()
    const utilsStore = useUtilsStore()
    return { settingsStore, utilsStore }
  },
  computed: {
    externalPlayerNames: function () {
      const fallbackNames = this.utilsStore.externalPlayerNames
      const nameTranslationKeys = this.utilsStore.externalPlayerNameTranslationKeys

      return nameTranslationKeys.map((translationKey, idx) => this.$te(translationKey) ? this.$t(translationKey) : fallbackNames[idx])
    },
    externalPlayerValues: function () {
      return this.utilsStore.externalPlayerValues
    },
    externalPlayer: function () {
      return this.settingsStore.externalPlayer
    },
    externalPlayerExecutable: function () {
      return this.settingsStore.externalPlayerExecutable
    },
    externalPlayerIgnoreWarnings: function () {
      return this.settingsStore.externalPlayerIgnoreWarnings
    },
    externalPlayerCustomArgs: function () {
      return this.settingsStore.externalPlayerCustomArgs
    },
    externalPlayerCustomArgsTooltip: function () {
      const tooltip = this.$t('Tooltips.External Player Settings.Custom External Player Arguments')
      const cmdArgs = this.utilsStore.externalPlayerCmdArguments[this.externalPlayer]
      if (cmdArgs && typeof cmdArgs.defaultCustomArguments === 'string' && cmdArgs.defaultCustomArguments !== '') {
        const defaultArgs = this.$t('Tooltips.External Player Settings.DefaultCustomArgumentsTemplate',
          { defaultCustomArguments: cmdArgs.defaultCustomArguments })
        return `${tooltip} ${defaultArgs}`
      }

      return tooltip
    }
  }
})
