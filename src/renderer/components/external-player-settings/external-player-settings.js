import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'ExternalPlayerSettings',
  components: {
    'ft-card': FtCard,
    'ft-select': FtSelect,
    'ft-input': FtInput,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {}
  },
  computed: {
    isDev: function () {
      return process.env.NODE_ENV === 'development'
    },

    externalPlayerNames: function () {
      return this.$store.getters.getExternalPlayerNames
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
        const defaultArgs = this.$t('Tooltips.External Player Settings.DefaultCustomArgumentsTemplate')
          .replace('$', cmdArgs.defaultCustomArguments)
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
