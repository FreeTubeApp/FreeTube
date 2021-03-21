import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'SponsorBlockSettings',
  components: {
    'ft-card': FtCard,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-input': FtInput,
    'ft-flex-box': FtFlexBox
  },
  computed: {
    useSponsorBlock: function () {
      return this.$store.getters.getUseSponsorBlock
    },
    sponsorBlockUrl: function () {
      return this.$store.getters.getSponsorBlockUrl
    }
  },
  methods: {
    handleUpdateSponsorBlock: function (value) {
      this.updateUseSponsorBlock(value)
    },

    handleUpdateSponsorBlockUrl: function (value) {
      this.updateSponsorBlockUrl(value)
    },

    ...mapActions([
      'updateUseSponsorBlock',
      'updateSponsorBlockUrl'
    ])
  }
})
