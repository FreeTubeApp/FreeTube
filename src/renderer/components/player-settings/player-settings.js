import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'PlayerSettings',
  components: {
    'ft-card': FtCard,
    'ft-select': FtSelect,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {
      title: 'Player Settings',
      formatNames: [
        'Dash Formats',
        'Legacy Formats',
        'YouTube Player'
      ],
      formatValues: [
        'dash',
        'legacy',
        'youtube'
      ],
      qualityNames: [
        'Auto',
        '144p',
        '240p',
        '360p',
        '480p',
        '720p',
        '1080p',
        '1440p',
        '4k',
        '8k'
      ],
      qualityValues: [
        'auto',
        '144',
        '240',
        '360',
        '480',
        '720',
        '1080',
        '1440',
        '4k',
        '8k'
      ]
    }
  },
  computed: {
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    }
  },
  mounted: function () {
  },
  methods: {
    goToChannel: function () {
      console.log('TODO: Handle goToChannel')
    }
  }
})
