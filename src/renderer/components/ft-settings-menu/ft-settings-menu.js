import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtSettingsMenu',
  props: {
    settingsSections: {
      type: Array,
      required: true
    },
  }
})
