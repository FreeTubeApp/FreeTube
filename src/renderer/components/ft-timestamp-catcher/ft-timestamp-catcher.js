import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtTimestampCatcher',
  props: {
    inputHtml: {
      type: String,
      default: ''
    }
  },
  methods: {
    catchTimestampClick: function (event) {
      this.$emit('timestamp-event', event.detail)
    },
    detectTimestamps: function (input) {
      const videoId = this.$route.params.id

      return input.replaceAll(/(?:(\d+):)?(\d+):(\d+)/g, (timestamp, hours, minutes, seconds) => {
        let time = 60 * Number(minutes) + Number(seconds)

        if (hours) {
          time += 3600 * Number(hours)
        }

        const url = this.$router.resolve({
          path: `/watch/${videoId}`,
          query: {
            timestamp: time
          }
        }).href

        // Adding the URL lets the user open the video in a new window at this timestamp
        return `<a href="${url}" onclick="event.preventDefault();this.dispatchEvent(new CustomEvent('timestamp-clicked',{bubbles:true,detail:${time}}));window.scrollTo(0,0)">${timestamp}</a>`
      })
    }
  }
})
