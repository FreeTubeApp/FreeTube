import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtSettingsSection',
  props: {
    title: {
      type: String,
      required: true
    },
    isOpenOverride: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    allSettingsTabsOpenedOrClosedDefault: function () {
      return this.$store.getters.getAllSettingsTabsOpenedOrClosedDefault
    }
  }
})
