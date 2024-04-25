import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtSettingsMenu',
  props: {
    settingsSections: {
      type: Array,
      required: true
    },
  },
  // emits: ['click'],
  // methods: {
  //   goToSection: function (section) {
  //     this.$emit('scroll-to-section', section)
  //   }
  // }
})
