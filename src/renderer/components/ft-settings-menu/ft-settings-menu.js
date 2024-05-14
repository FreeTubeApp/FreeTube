import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtSettingsMenu',
  props: {
    settingsSections: {
      type: Array,
      required: true
    },
  },
  emits: ['scroll-to-section'],
  methods: {
    goToSettingsSection: function (sectionType) {
      this.$emit('scroll-to-section', sectionType)
    }
  }
})
