import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtLoader',
  props: {
    fullscreen: {
      type: Boolean,
      default: false
    }
  }
})
