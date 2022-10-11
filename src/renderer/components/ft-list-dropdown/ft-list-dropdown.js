import Vue from 'vue'
import { removeWhitespace, handleDropdownKeyboardEvent } from '../../helpers/accessibility'
export default Vue.extend({
  name: 'FtListDropdown',
  props: {
    title: {
      type: String,
      required: true
    },
    labelNames: {
      type: Array,
      required: true
    },
    labelValues: {
      type: Array,
      required: true
    }
  },
  data: function () {
    return {
      id: '',
      thumbnail: '',
      channelName: '',
      subscriberCount: 0,
      videoCount: '',
      uploadedTime: '',
      description: ''
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    }
  },
  methods: {
    removeWhitespace,
    handleIconKeyPress(event) {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Tab') {
          return
        }

        event.preventDefault()

        if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'ArrowDown') {
          return
        }
      }

      const firstOption = document.getElementById('buttonOption0')
      firstOption.setAttribute('tabIndex', 1)
      firstOption.focus()
    },
    handleDropdownClick: function(index, event) {
      if (!handleDropdownKeyboardEvent(event, event?.target)) {
        return
      }

      const unspacedTitle = removeWhitespace(this.title)
      const allOptions = document.querySelector(`#${unspacedTitle} + ul`)
      allOptions.setAttribute('tabindex', '-1')
      event.target.setAttribute('tabindex', '0')
      this.$emit('click', this.labelValues[index])
    }
  }
})
