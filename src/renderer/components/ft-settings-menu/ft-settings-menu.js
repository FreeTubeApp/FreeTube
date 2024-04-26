import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtSettingsMenu',
  props: {
    settingsSections: {
      type: Array,
      required: true
    },
  },
  methods: {
    getTitleForSection: function(settingsSection) {
      return settingsSection.shortTitle !== '' ? settingsSection.shortTitle : settingsSection.title
    }
  }
})
