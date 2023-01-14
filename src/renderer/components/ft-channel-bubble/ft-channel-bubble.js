import { defineComponent } from 'vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'

export default defineComponent({
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
  computed: {
    sanitizedId: function() {
      return 'channelBubble' + sanitizeForHtmlId(this.channelName)
    }
  },
  methods: {
    handleClick: function (event) {
      if (event instanceof KeyboardEvent) {
        if (event.target.getAttribute('role') === 'link' && event.key !== 'Enter') {
          return
        }
        event.preventDefault()
      }

      if (this.showSelected) {
        this.selected = !this.selected
      }
      this.$emit('click')
    }
  }
})
