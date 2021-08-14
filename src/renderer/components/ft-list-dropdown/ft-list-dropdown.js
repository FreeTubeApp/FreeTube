import Vue from 'vue'
import $ from 'jquery'

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

      const firstOption = $('#buttonOption0')
      firstOption.attr('tabindex', 0)
      firstOption.focus()
    },
    handleDropdownClick: function(index, event) {
      if (!this.$handleDropdownKeyboardEvent(event)) {
        return
      }

      const listbox = $(`#${this.title}`)
      const allOptions = listbox.find('ul')

      allOptions.attr('tabindex', '-1')

      event.target.setAttribute('tabindex', '0')
      this.$emit('click', this.labelValues[index])
    }
  }
})
