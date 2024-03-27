import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtNotificationBanner',
  props: {
    message: {
      type: String,
      required: true
    }
  },
  emits: ['click'],
  methods: {
    handleClick: function (response) {
      this.$emit('click', response)
    },

    handleClose: function () {
      this.handleClick(false)
    }
  }
})
