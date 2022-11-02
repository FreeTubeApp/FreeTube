import Vue from 'vue'

export default Vue.extend({
  name: 'FtSettingsSection',
  props: {
    title: {
      type: String,
      required: true
    }
  }
})
