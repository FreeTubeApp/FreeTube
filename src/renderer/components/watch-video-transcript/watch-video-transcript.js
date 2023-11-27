import { defineComponent } from 'vue'
import { parseVTTFile, transformCaptions } from '../../helpers/captions'

export default defineComponent({
  name: 'Watch',
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
      captions: []
    }
  },
  computed: {
    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
    },
  },
  mounted: async function () {
    this.captions = await transformCaptions(this.captionHybridList, this.currentLocale)
  },
})
