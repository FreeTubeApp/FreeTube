import Vue from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtSponsorBlockCategory from '../ft-sponsor-block-category/ft-sponsor-block-category.vue'

export default Vue.extend({
  name: 'SponsorBlockSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-input': FtInput,
    'ft-flex-box': FtFlexBox,
    'ft-sponsor-block-category': FtSponsorBlockCategory
  },
  data: function () {
    return {
      categories: [
        'sponsor',
        'self-promotion',
        'interaction',
        'intro',
        'outro',
        'recap',
        'music offtopic',
        'filler'
      ]
    }
  },
  computed: {
    useSponsorBlock: function () {
      return this.$store.getters.getUseSponsorBlock
    },
    sponsorBlockUrl: function () {
      return this.$store.getters.getSponsorBlockUrl
    },
    sponsorBlockShowSkippedToast: function () {
      return this.$store.getters.getSponsorBlockShowSkippedToast
    }
  },
  methods: {
    handleUpdateSponsorBlock: function (value) {
      this.updateUseSponsorBlock(value)
    },

    handleUpdateSponsorBlockUrl: function (value) {
      const sponsorBlockUrlWithoutTrailingSlash = value.replace(/\/$/, '')
      const sponsorBlockUrlWithoutApiSuffix = sponsorBlockUrlWithoutTrailingSlash.replace(/\/api$/, '')
      this.updateSponsorBlockUrl(sponsorBlockUrlWithoutApiSuffix)
    },

    handleUpdateSponsorBlockShowSkippedToast: function (value) {
      this.updateSponsorBlockShowSkippedToast(value)
    },

    ...mapActions([
      'updateUseSponsorBlock',
      'updateSponsorBlockUrl',
      'updateSponsorBlockShowSkippedToast'
    ])
  }
})
