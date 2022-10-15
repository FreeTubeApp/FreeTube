import Vue from 'vue'
import { mapActions } from 'vuex'
import { colors } from '../../helpers/utils'
import FtSelect from '../ft-select/ft-select.vue'

export default Vue.extend({
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
      categoryColor: '',
      skipOption: '',
      skipValues: [
        'autoSkip',
        // 'promptToSkip',
        'showInSeekBar',
        'doNothing'
      ]
    }
  },
  computed: {
    colorValues: function () {
      return colors.map(color => color.name)
    },

    colorNames: function () {
      return this.colorValues.map(colorVal => {
        // add spaces before capital letters
        const colorName = colorVal.replace(/([A-Z])/g, ' $1').trim()
        return this.$t(`Settings.Theme Settings.Main Color Theme.${colorName}`)
      })
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

    skipNames: function() {
      return [
        this.$t('Settings.SponsorBlock Settings.Skip Options.Auto Skip'),
        // this.$t('Settings.SponsorBlock Settings.Skip Options.Prompt To Skip'),
        this.$t('Settings.SponsorBlock Settings.Skip Options.Show In Seek Bar'),
        this.$t('Settings.SponsorBlock Settings.Skip Options.Do Nothing')
      ]
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
      'openExternalLink',
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
