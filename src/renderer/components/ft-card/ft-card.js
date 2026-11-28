import { defineComponent, useTemplateRef } from 'vue'

export default defineComponent({
  name: 'FtCard',
  setup(_, { expose }) {
    const card = useTemplateRef('card')

    expose({ getBounds: () => card.value.getBoundingClientRect() })
  }
})
