import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtSettingsMenu',
  props: {
    settingsSections: {
      type: Array,
      required: true
    },
  },
  emits: ['navigate-to-section'],
  methods: {
    goToSettingsSection: function (sectionType) {
      this.$emit('navigate-to-section', sectionType)
    }
  }
})
