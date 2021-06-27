import Vue from 'vue'

export default Vue.extend({
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
    }
  }
})
