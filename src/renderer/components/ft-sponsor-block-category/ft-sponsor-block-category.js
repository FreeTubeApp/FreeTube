import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import { getColors } from '../../helpers/colors'
import FtSelect from '../ft-select/ft-select.vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'

export default defineComponent({
  name: 'FtSponsorBlockCategory',
  components: {
    'ft-select': FtSelect
  },
  props: {
    categoryName: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      skipValues: [
        'autoSkip',
        // 'promptToSkip',
        'showInSeekBar',
        'doNothing'
      ]
    }
  },
  computed: {
    colors: function () {
      return getColors()
    },

    colorValues: function () {
      return this.colors.map(color => color.name)
    },

    colorNames: function () {
      return this.colors.map(color => color.translated)
    },

    sponsorBlockValues: function() {
      let sponsorVal = ''
      switch (this.categoryName.toLowerCase()) {
        case 'sponsor':
          sponsorVal = this.$store.getters.getSponsorBlockSponsor
          break
        case 'self-promotion':
          sponsorVal = this.$store.getters.getSponsorBlockSelfPromo
          break
        case 'interaction':
          sponsorVal = this.$store.getters.getSponsorBlockInteraction
          break
        case 'intro':
          sponsorVal = this.$store.getters.getSponsorBlockIntro
          break
        case 'outro':
          sponsorVal = this.$store.getters.getSponsorBlockOutro
          break
        case 'recap':
          sponsorVal = this.$store.getters.getSponsorBlockRecap
          break
        case 'music offtopic':
          sponsorVal = this.$store.getters.getSponsorBlockMusicOffTopic
          break
        case 'filler':
          sponsorVal = this.$store.getters.getSponsorBlockFiller
          break
      }
      return sponsorVal
    },

    sanitizedId: function() {
      return sanitizeForHtmlId(this.categoryName)
    },

    skipNames: function() {
      return [
        this.$t('Settings.SponsorBlock Settings.Skip Options.Auto Skip'),
        // this.$t('Settings.SponsorBlock Settings.Skip Options.Prompt To Skip'),
        this.$t('Settings.SponsorBlock Settings.Skip Options.Show In Seek Bar'),
        this.$t('Settings.SponsorBlock Settings.Skip Options.Do Nothing')
      ]
    },

    translatedCategoryName: function() {
      switch (this.categoryName.toLowerCase()) {
        case 'sponsor':
          return this.$t('Video.Sponsor Block category.sponsor')
        case 'self-promotion':
          return this.$t('Video.Sponsor Block category.self-promotion')
        case 'interaction':
          return this.$t('Video.Sponsor Block category.interaction')
        case 'intro':
          return this.$t('Video.Sponsor Block category.intro')
        case 'outro':
          return this.$t('Video.Sponsor Block category.outro')
        case 'recap':
          return this.$t('Video.Sponsor Block category.recap')
        case 'music offtopic':
          return this.$t('Video.Sponsor Block category.music offtopic')
        case 'filler':
          return this.$t('Video.Sponsor Block category.filler')
        default:
          return ''
      }
    }
  },

  methods: {
    updateColor: function (color) {
      const payload = {
        color: color,
        skip: this.sponsorBlockValues.skip
      }
      this.updateSponsorCategory(payload)
    },

    updateSkipOption: function (skipOption) {
      const payload = {
        color: this.sponsorBlockValues.color,
        skip: skipOption
      }

      this.updateSponsorCategory(payload)
    },

    updateSponsorCategory: function (payload) {
      switch (this.categoryName.toLowerCase()) {
        case 'sponsor':
          this.updateSponsorBlockSponsor(payload)
          break
        case 'self-promotion':
          this.updateSponsorBlockSelfPromo(payload)
          break
        case 'interaction':
          this.updateSponsorBlockInteraction(payload)
          break
        case 'intro':
          this.updateSponsorBlockIntro(payload)
          break
        case 'outro':
          this.updateSponsorBlockOutro(payload)
          break
        case 'recap':
          this.updateSponsorBlockRecap(payload)
          break
        case 'music offtopic':
          this.updateSponsorBlockMusicOffTopic(payload)
          break
        case 'filler':
          this.updateSponsorBlockFiller(payload)
          break
      }
    },

    ...mapActions([
      'updateSponsorBlockSponsor',
      'updateSponsorBlockSelfPromo',
      'updateSponsorBlockInteraction',
      'updateSponsorBlockIntro',
      'updateSponsorBlockOutro',
      'updateSponsorBlockRecap',
      'updateSponsorBlockMusicOffTopic',
      'updateSponsorBlockFiller'
    ])
  }
})
