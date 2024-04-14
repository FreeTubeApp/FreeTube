import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtSettingsSection',
  props: {
    title: {
      type: String,
      required: true
    },
  },
  computed: {
    allSettingsSectionsExpandedByDefault: function () {
      return this.$store.getters.getAllSettingsSectionsExpandedByDefault
    }
  }
})
