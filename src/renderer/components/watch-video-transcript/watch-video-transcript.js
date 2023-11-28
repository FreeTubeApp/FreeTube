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
    captionHybridList: {
      type: Array,
      default: () => []
    },
    hideTranscript: {
      type: Function,
      default: () => { }
    }
  },

  data: function () {
    return {
      activeLanguage: '',
      activeCaption: undefined,
      captions: [],
      captionLanguages: [],
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

  mounted: async function () {
    this.captions = await transformCaptions(this.captionHybridList, this.currentLocale)
    this.activeCaption = await parseCaptionString(this.captions[0])
    this.activeLanguage = this.activeCaption.label
    this.captionLanguages = this.captions.map(caption => caption.label)
  },

  methods: {
    handleMenuClick: function (menuAction) {
      switch (menuAction) {
        case 'toggle-timestamp':
          this.timestampShown = !this.timestampShown
          break
      }
    },

    handleLanguageChange: async function (language) {
      this.activeCaption = this.captions.find(caption => caption.label === language)
      this.activeCaption = await parseCaptionString(this.activeCaption)
    },

    jumpTimestamp: function (timestampSeconds) {
      this.$emit('timestamp-event', timestampSeconds)
    }
  }
})
