import Vue from 'vue'

export default Vue.extend({
  name: 'FtChannelBubble',
  props: {
    channelName: {
      type: String,
      required: true
    },
    channelThumbnail: {
      type: String,
      required: true
    },
    showSelected: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      selected: false
    }
  },
  methods: {
    handleClick: function () {
      if (this.showSelected) {
        this.selected = !this.selected
      }
      this.$emit('click')
    }
  }
})
