import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtAgeRestricted',
  props: {
    contentTypeString: {
      type: String,
      required: true
    }
  },
  computed: {
    emoji: function () {
      const emojis = ['😵', '😦', '🙁', '☹️', '😦', '🤫', '😕']
      return emojis[Math.floor(Math.random() * emojis.length)]
    },

    restrictedMessage: function () {
      if (this.contentTypeString === 'Channel') {
        return this.$t('Age Restricted.This channel is age restricted')
      } else {
        return this.$t('Age Restricted.This video is age restricted')
      }
    }
  }
})
