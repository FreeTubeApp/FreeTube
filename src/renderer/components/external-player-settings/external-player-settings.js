import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtInputTags from '../ft-input-tags/ft-input-tags.vue'

export default defineComponent({
  name: 'ExternalPlayerSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox,
    'ft-input-tags': FtInputTags
  },
  computed: {
    externalPlayerNames: function () {
      const fallbackNames = this.$store.getters.getExternalPlayerNames
      const translations = [{
        name: 'None',
        translatedValue: this.$t('Settings.External Player Settings.Players.None.Name')
      }]

      return fallbackNames.map((name) => {
        const translation = translations.find(e => e.name === name)
        return translation ? translation.translatedValue : name
      })
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
    externalPlayerIgnoreDefaultArgs: function () {
      return this.$store.getters.getExternalPlayerIgnoreDefaultArgs
    },
    externalPlayerCustomArgs: function () {
      return JSON.parse(this.$store.getters.getExternalPlayerCustomArgs)
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
    handleExternalPlayerCustomArgs(value) {
      this.updateExternalPlayerCustomArgs(JSON.stringify(value))
    },

    ...mapActions([
      'updateExternalPlayer',
      'updateExternalPlayerExecutable',
      'updateExternalPlayerIgnoreWarnings',
      'updateExternalPlayerIgnoreDefaultArgs',
      'updateExternalPlayerCustomArgs'
    ])
  }
})
