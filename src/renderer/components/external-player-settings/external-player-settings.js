import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default defineComponent({
  name: 'ExternalPlayerSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {}
  },
  computed: {
    externalPlayerNames: function () {
      const fallbackNames = this.$store.getters.getExternalPlayerNames
      const nameTranslationKeys = this.$store.getters.getExternalPlayerNameTranslationKeys.map((translationKey, idx) => this.$te(translationKey) ? this.$t(translationKey) : fallbackNames[idx])

      // Sort list of external players alphabetically & case-insensitive and keep the default 'None' in the first index
      const nameTranslationKeysSorted = [...nameTranslationKeys]

      nameTranslationKeysSorted.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

      const playerNone = nameTranslationKeys[0]
      const playerNoneIndex = nameTranslationKeysSorted.indexOf(playerNone)

      nameTranslationKeysSorted.splice(playerNoneIndex, 1)
      nameTranslationKeysSorted.unshift(playerNone)

      return nameTranslationKeysSorted
    },
    externalPlayerValues: function () {
      return this.$store.getters.getExternalPlayerValues
    },
    externalPlayer: function () {
      return this.$store.getters.getExternalPlayer
    },
    externalPlayerExecutable: function () {
      return this.$store.getters.getExternalPlayerExecutable
    },
    externalPlayerIgnoreWarnings: function () {
      return this.$store.getters.getExternalPlayerIgnoreWarnings
    },
    externalPlayerCustomArgs: function () {
      return this.$store.getters.getExternalPlayerCustomArgs
    },
    externalPlayerCustomArgsTooltip: function () {
      const tooltip = this.$t('Tooltips.External Player Settings.Custom External Player Arguments')

      const cmdArgs = this.$store.getters.getExternalPlayerCmdArguments[this.externalPlayer]
      if (cmdArgs && typeof cmdArgs.defaultCustomArguments === 'string' && cmdArgs.defaultCustomArguments !== '') {
        const defaultArgs = this.$t('Tooltips.External Player Settings.DefaultCustomArgumentsTemplate',
          { defaultCustomArguments: cmdArgs.defaultCustomArguments })
        return `${tooltip} ${defaultArgs}`
      }

      return tooltip
    }
  },
  methods: {
    ...mapActions([
      'updateExternalPlayer',
      'updateExternalPlayerExecutable',
      'updateExternalPlayerIgnoreWarnings',
      'updateExternalPlayerCustomArgs'
    ])
  }
})
