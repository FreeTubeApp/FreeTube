import Vue from 'vue'

export default Vue.extend({
  name: 'FtTimestampCatcher',
  props: {
    inputHtml: {
      type: String,
      default: ''
    }
  },
  methods: {
    catchTimestampClick: function(event) {
      const match = event.detail.match(/(\d+):(\d+):?(\d+)?/)
      if (match[3] !== undefined) { // HH:MM:SS
        const seconds = 3600 * Number(match[1]) + 60 * Number(match[2]) + Number(match[3])
        this.$emit('timestamp-event', seconds)
      } else { // MM:SS
        const seconds = 60 * Number(match[1]) + Number(match[2])
        this.$emit('timestamp-event', seconds)
      }
    },
    detectTimestamps: function (input) {
      return input.replaceAll(/(\d+(:\d+)+)/g, '<a href="#" onclick="this.dispatchEvent(new CustomEvent(\'timestamp-clicked\',{bubbles:true, detail:\'$1\'}))">$1</a>')
    }
  }
})
