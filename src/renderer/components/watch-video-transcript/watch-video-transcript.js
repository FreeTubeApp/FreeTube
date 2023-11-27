import { defineComponent } from 'vue'
import { transformCaptions } from '../../helpers/captions'
import FtCard from '../ft-card/ft-card.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'

export default defineComponent({
  name: 'Watch',
  components: {
    'ft-card': FtCard,
    'ft-icon-button': FtIconButton
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
      captions: [],
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
  },

  methods: {
    handleMenuClick: function (menuAction) {
      switch (menuAction) {
        case 'toggle-timestamp':
          this.timestampShown = !this.timestampShown
          break
      }
    }
  }
})
