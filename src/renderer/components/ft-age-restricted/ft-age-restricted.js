import { defineComponent } from 'vue'

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
      const emojis = ['😵', '😦', '🙁', '☹️', '😦', '🤫', '😕']
      return emojis[Math.floor(Math.random() * emojis.length)]
    },

    restrictedMessage: function () {
      if (this.isChannel) {
        return this.$t('Age Restricted.This channel is age restricted')
      }

      return this.$t('Age Restricted.This video is age restricted')
    }
  }
})
