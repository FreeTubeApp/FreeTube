import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtCard',
  props: {
    big: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    useFullWidthLayout: function () {
      return this.$store.getters.getUseFullWidthLayout
    }
  }
})
