import { defineComponent } from 'vue'
import { MiscConstants } from '../../../constants'

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
    showSelected: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      selected: false,
    }
  },
  computed: {
    sanitizedId: function() {
      return 'channelBubble' + this.channelId
    }
  },
  created () {
    this.CHANNEL_IMAGE_BROKEN = MiscConstants.CHANNEL_IMAGE_BROKEN
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
