import Vue from 'vue'
import { mapActions } from 'vuex'
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
      ],
      colorValues: [
        'Red',
        'Pink',
        'Purple',
        'DeepPurple',
        'Indigo',
        'Blue',
        'LightBlue',
        'Cyan',
        'Teal',
        'Green',
        'LightGreen',
        'Lime',
        'Yellow',
        'Amber',
        'Orange',
        'DeepOrange',
        'DraculaCyan',
        'DraculaGreen',
        'DraculaOrange',
        'DraculaPink',
        'DraculaPurple',
        'DraculaRed',
        'DraculaYellow'
      ]
    }
  },
  computed: {
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
    },
    colorNames: function () {
      return [
        this.$t('Settings.Theme Settings.Main Color Theme.Red'),
        this.$t('Settings.Theme Settings.Main Color Theme.Pink'),
        this.$t('Settings.Theme Settings.Main Color Theme.Purple'),
        this.$t('Settings.Theme Settings.Main Color Theme.Deep Purple'),
        this.$t('Settings.Theme Settings.Main Color Theme.Indigo'),
        this.$t('Settings.Theme Settings.Main Color Theme.Blue'),
        this.$t('Settings.Theme Settings.Main Color Theme.Light Blue'),
        this.$t('Settings.Theme Settings.Main Color Theme.Cyan'),
        this.$t('Settings.Theme Settings.Main Color Theme.Teal'),
        this.$t('Settings.Theme Settings.Main Color Theme.Green'),
        this.$t('Settings.Theme Settings.Main Color Theme.Light Green'),
        this.$t('Settings.Theme Settings.Main Color Theme.Lime'),
        this.$t('Settings.Theme Settings.Main Color Theme.Yellow'),
        this.$t('Settings.Theme Settings.Main Color Theme.Amber'),
        this.$t('Settings.Theme Settings.Main Color Theme.Orange'),
        this.$t('Settings.Theme Settings.Main Color Theme.Deep Orange'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Cyan'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Green'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Orange'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Pink'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Purple'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Red'),
        this.$t('Settings.Theme Settings.Main Color Theme.Dracula Yellow')
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
      }
    },

    ...mapActions([
      'showToast',
      'openExternalLink',
      'updateSponsorBlockSponsor',
      'updateSponsorBlockSelfPromo',
      'updateSponsorBlockInteraction',
      'updateSponsorBlockIntro',
      'updateSponsorBlockOutro',
      'updateSponsorBlockRecap',
      'updateSponsorBlockMusicOffTopic'
    ])
  }
})
