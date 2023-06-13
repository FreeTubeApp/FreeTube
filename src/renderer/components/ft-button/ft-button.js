import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtButton',
  props: {
    label: {
      type: String,
      default: ''
    },
    textColor: {
      type: String,
      default: 'var(--text-with-accent-color)'
    },
    backgroundColor: {
      type: String,
      default: 'var(--accent-color)'
    },
    id: {
      type: String,
      default: ''
    },
    tabindex: {
      type: Number,
      // Relies on template to not output tabindex on values < -1
      default: -2,
    },
  }
})
