import { defineComponent } from 'vue'
import { randomArrayItem } from '../../helpers/utils'

export default defineComponent({
  name: 'FtAgeRestricted',
  props: {
    isChannel: {
      type: Boolean,
      default: false,
    },
    isVideo: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    emoji: function () {
      return randomArrayItem(['😵', '😦', '🙁', '☹️', '😦', '🤫', '😕'])
    },

    restrictedMessage: function () {
      if (this.isChannel) {
        return this.$t('Age Restricted.This channel is age restricted')
      }

      return this.$t('Age Restricted.This video is age restricted')
    }
  }
})
