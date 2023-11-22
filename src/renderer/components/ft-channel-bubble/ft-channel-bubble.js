import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtChannelBubble',
  props: {
    channelId: {
      type: String,
      required: true
    },
    channelName: {
      type: String,
      required: true
    },
    channelThumbnail: {
      type: String,
      required: true
    },
    bubbleSize: {
      type: Number,
      default: 50
    },
    showSelected: {
      type: Boolean,
      default: false
    },
    showTitle: {
      type: Boolean,
      default: true
    },
    sideNavGrid: {
      type: Boolean,
      default: false
    },
  },
  data: function () {
    return {
      selected: false
    }
  },
  computed: {
    sanitizedId: function() {
      return 'channelBubble' + this.channelId
    }
  },
  methods: {
    handleClick: function (event) {
      if (event instanceof KeyboardEvent) {
        event.preventDefault()
      }

      if (this.showSelected) {
        this.selected = !this.selected
      }
      this.$emit('click')
    }
  }
})
