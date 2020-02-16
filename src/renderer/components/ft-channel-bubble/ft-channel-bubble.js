import Vue from 'vue'

export default Vue.extend({
  name: 'FtChannelBubble',
  props: {
    channelName: {
      type: String,
      required: true
    },
    channelId: {
      type: String,
      required: true
    },
    channelThumbnail: {
      type: String,
      required: true
    }
  },
  methods: {
    goToChannel: function () {
      console.log('Go to channel')
    }
  }
})
