import Vue from 'vue'

export default Vue.extend({
  name: 'FtButton',
  props: {
    label: {
      type: String,
      default: ''
    },
    textColor: {
      type: String,
      default: 'var(--text-with-accent-color)'
    },
    backgroundColor: {
      type: String,
      default: 'var(--accent-color)'
    },
    id: {
      type: String,
      default: ''
    }
  }
})
