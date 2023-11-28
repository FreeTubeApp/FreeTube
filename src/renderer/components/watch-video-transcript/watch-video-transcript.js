import { defineComponent } from 'vue'
import { parseCaptionString, transformCaptions } from '../../helpers/captions'
import FtCard from '../ft-card/ft-card.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtSelect from '../ft-select/ft-select.vue'

export default defineComponent({
  name: 'Watch',
  components: {
    'ft-card': FtCard,
    'ft-icon-button': FtIconButton,
    'ft-select': FtSelect,
  },

  props: {
    videoTimestamp: {
      type: Number,
      default: -1
    },
    captionHybridList: {
      type: Array,
      default: () => []
    }
  },

  data: function () {
    return {
      activeLanguage: '',
      activeCaption: undefined,
      activeCueIndex: -1,
      autoScrollDisabled: false,
      autoScrollTimeout: undefined,
      captions: [],
      captionLanguages: [],
      timestamp: -1,
      timestampShown: true,
    }
  },

  computed: {
    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
    },
    menuOptions: function () {
      return [
        {
          label: this.$t('Transcript.Toggle timestamps'),
          value: 'toggle-timestamp'
        }
      ]
    }
  },

  watch: {
    videoTimestamp: function (value) {
      if (!this.activeCaption || this.timestamp === value) return
      this.timestamp = value

      for (const [index, cue] of this.activeCaption.cues.entries()) {
        if (value >= cue.startTime && value < cue.endTime) {
          this.activeCueIndex = index
          this.autoScrollCue()
          break
        }
      }
    }
  },

  mounted: async function () {
    this.captions = await transformCaptions(this.captionHybridList, this.currentLocale)
    this.activeCaption = await parseCaptionString(this.captions[0])
    this.activeLanguage = this.activeCaption.label
    this.captionLanguages = this.captions.map(caption => caption.label)
    this.timestamp = this.videoTimestamp
  },

  methods: {
    autoScrollCue: function () {
      if (this.autoScrollDisabled) return

      const body = this.$refs.cueBody
      const activeCue = this.$refs.cueBody.children[this.activeCueIndex]
      if (!body || !activeCue) return

      let offsetTop = activeCue.offsetTop - body.offsetTop

      // Show previous 2 cues if possible
      if (this.activeCueIndex > 0) offsetTop -= this.$refs.cueBody.children[this.activeCueIndex - 1].offsetHeight
      if (this.activeCueIndex > 1) offsetTop -= this.$refs.cueBody.children[this.activeCueIndex - 2].offsetHeight

      // Raise flag to indicate scroll was automated
      body.setAttribute('data-autoscroll', '')
      body.scrollTo({ top: offsetTop })
    },

    disableAutoScroll: function (event) {
      // If scroll was automated, do not disable autoscroll
      if (event.target.hasAttribute('data-autoscroll')) {
        event.target.removeAttribute('data-autoscroll')
        return
      }

      clearTimeout(this.autoScrollTimeout)
      this.autoScrollDisabled = true

      this.autoScrollTimeout = setTimeout(() => {
        this.autoScrollDisabled = false
      }, 3000)
    },

    handleMenuClick: function (menuAction) {
      switch (menuAction) {
        case 'toggle-timestamp':
          this.timestampShown = !this.timestampShown
          break
      }
    },

    handleLanguageChange: async function (language) {
      this.activeCaption = false
      this.activeCaption = this.captions.find(caption => caption.label === language)
      this.activeCaption = await parseCaptionString(this.activeCaption)
      this.activeLanguage = this.activeCaption.label
    },
  },
})
