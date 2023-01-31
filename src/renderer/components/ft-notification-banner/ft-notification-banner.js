import { defineComponent } from 'vue'
import { useUtilsStore } from '../../stores'

export default defineComponent({
  name: 'FtNotificationBanner',
  props: {
    message: {
      type: String,
      required: true
    }
  },
  setup() {
    const utilsStore = useUtilsStore()
    return { utilsStore }
  },
  computed: {
    progressBarPercentage: function () {
      return this.utilsStore.progressBarPercentage
    }
  },
  methods: {
    handleClick: function (response) {
      this.$emit('click', response)
    },

    handleClose: function () {
      this.handleClick(false)
    }
  }
})
