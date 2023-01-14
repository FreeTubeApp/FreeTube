import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtAutoGrid',
  props: {
    grid: {
      type: Boolean,
      required: true
    }
  }
})
