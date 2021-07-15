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
  mounted: function() {
    $(`#${this.title}`).focusout(() => { $(`#${this.title}`).attr('aria-expanded', 'false') })
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
      const ul = firstOption.parent()
      ul.get(0).style.display = 'block'
      firstOption.attr('tabindex', 0)
      firstOption.focus()
    },
    handleDropdownClick: function(index, event) {
      if (event instanceof KeyboardEvent) {
        let nextElement = null
        if (event.key === 'Tab') {
          $('#buttonOption0').parent().get(0).style.display = 'none'
          $(`#${this.title}`).attr('aria-expanded', 'false')
          return
        } if (event.key === 'ArrowUp') {
          nextElement = event.target.previousElementSibling
        } else if (event.key === 'ArrowDown') {
          nextElement = event.target.nextElementSibling
        } else if (event.key === 'Home') {
          nextElement = event.target.parentNode.firstElementChild
        } else if (event.key === 'End') {
          nextElement = event.target.parentNode.lastElementChild
        }

        event.preventDefault()

        if (nextElement) {
          event.target.setAttribute('tabindex', '-1')
          nextElement.setAttribute('tabindex', '0')
          nextElement.focus()
        }

        if (event.key !== 'Enter' && event.key !== ' ') {
          return
        }
      }

      const listbox = $(`#${this.title}`)
      const allOptions = listbox.find('ul')

      allOptions.attr('aria-selected', 'false')
      allOptions.attr('tabindex', '-1')

      event.target.setAttribute('aria-selected', 'true')
      event.target.setAttribute('tabindex', '0')
      this.$emit('click', this.labelValues[index])
    },
    goToChannel: function () {
      console.log('TODO: ft-list-channel method goToChannel')
    }
  }
})
