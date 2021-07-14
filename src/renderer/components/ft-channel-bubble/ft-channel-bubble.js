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
    handleClick: function (event) {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Tab') {
          return
        }

        if (event.target.getAttribute('role') === 'link' && event.key !== 'Enter') {
          return
        } else if (event.key !== 'Enter' && event.key !== ' ') {
          return
        }
      }

      if (this.showSelected) {
        this.selected = !this.selected
      }
      this.$emit('click')
    }
  }
})
