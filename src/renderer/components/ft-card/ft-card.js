import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtCard',
  emits: ['focusout'],
  methods: {
    focusOut: function () {
      this.$emit('focusout')
    }
  }
})
