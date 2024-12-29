import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtSponsorBlockCategory from '../FtSponsorBlockCategory/FtSponsorBlockCategory.vue'

export default defineComponent({
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
    },

    useDeArrowTitles: function () {
      return this.$store.getters.getUseDeArrowTitles
    },
    useDeArrowThumbnails: function () {
      return this.$store.getters.getUseDeArrowThumbnails
    },
    deArrowThumbnailGeneratorUrl: function () {
      return this.$store.getters.getDeArrowThumbnailGeneratorUrl
    },
  },
  methods: {
    handleUpdateSponsorBlock: function (value) {
      this.updateUseSponsorBlock(value)
    },

    handleUpdateUseDeArrowTitles: function (value) {
      this.updateUseDeArrowTitles(value)
    },

    handleUpdateUseDeArrowThumbnails: function (value) {
      this.updateUseDeArrowThumbnails(value)
    },

    handleUpdateSponsorBlockUrl: function (value) {
      const sponsorBlockUrlWithoutTrailingSlash = value.replace(/\/$/, '')
      const sponsorBlockUrlWithoutApiSuffix = sponsorBlockUrlWithoutTrailingSlash.replace(/\/api$/, '')
      this.updateSponsorBlockUrl(sponsorBlockUrlWithoutApiSuffix)
    },

    handleUpdateDeArrowThumbnailGeneratorUrl: function (value) {
      const urlWithoutTrailingSlash = value.replace(/\/$/, '')
      const urlWithoutApiSuffix = urlWithoutTrailingSlash.replace(/\/api$/, '')
      this.updateDeArrowThumbnailGeneratorUrl(urlWithoutApiSuffix)
    },

    handleUpdateSponsorBlockShowSkippedToast: function (value) {
      this.updateSponsorBlockShowSkippedToast(value)
    },

    ...mapActions([
      'updateUseSponsorBlock',
      'updateSponsorBlockUrl',
      'updateSponsorBlockShowSkippedToast',
      'updateUseDeArrowTitles',
      'updateUseDeArrowThumbnails',
      'updateDeArrowThumbnailGeneratorUrl'
    ])
  }
})
