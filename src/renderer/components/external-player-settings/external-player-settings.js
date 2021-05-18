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
    return {
      externalPlayerNames: [
        'None',
        'mpv'
      ],
      externalPlayerValues: [
        '',
        'mpv'
      ]
    }
  },
  computed: {
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
    }
  },
  methods: {
    handleUpdateExternalPlayerExecutable: function (value) {
      this.updateExternalPlayerExecutable(value)
    },

    handleUpdateExternalPlayerCustomArgs: function (value) {
      this.updateExternalPlayerCustomArgs(value)
    },

    ...mapActions([
      'updateExternalPlayer',
      'updateExternalPlayerExecutable',
      'updateExternalPlayerIgnoreWarnings',
      'updateExternalPlayerCustomArgs'
    ])
  }
})
