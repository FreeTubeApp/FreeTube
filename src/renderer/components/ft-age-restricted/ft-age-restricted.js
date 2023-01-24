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
      const contentType = this.$t('Age Restricted.Type.' + this.contentTypeString)
      return this.$t('Age Restricted.This {videoOrPlaylist} is age restricted', { videoOrPlaylist: contentType })
    }
  }
})
