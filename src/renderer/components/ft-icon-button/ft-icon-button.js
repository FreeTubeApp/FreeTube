import Vue from 'vue'
import $ from 'jquery'

export default Vue.extend({
  name: 'FtIconButton',
  props: {
    title: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'ellipsis-v'
    },
    theme: {
      type: String,
      default: 'base'
    },
    useShadow: {
      type: Boolean,
      default: true
    },
    padding: {
      type: Number,
      default: 10
    },
    size: {
      type: Number,
      default: 20
    },
    forceDropdown: {
      type: Boolean,
      default: false
    },
    dropdownPositionX: {
      type: String,
      default: 'center'
    },
    dropdownPositionY: {
      type: String,
      default: 'bottom'
    },
    dropdownNames: {
      type: Array,
      default: () => { return [] }
    },
    dropdownValues: {
      type: Array,
      default: () => { return [] }
    }
  },
  data: function () {
    return {
      showDropdown: false,
      id: ''
    }
  },
  mounted: function () {
    this.id = `iconButton${this._uid}`
  },
  methods: {
    toggleDropdown: function () {
      const thisButton = $(`#${this.id}`)
      thisButton.get(0).style.display = 'inline'
      const firstItem = thisButton.find('.listItem').first()
      firstItem.attr('tabindex', '0')
      firstItem.attr('aria-selected', true)
      thisButton.attr('aria-expanded', 'true')
      firstItem.focus()

      $(`#${this.id}`).focusout((e) => {
        if ($(`#${this.id}`).has(e.relatedTarget).length) {
          return
        }

        const shareLinks = $(`#${this.id}`).find('.shareLinks')

        if (shareLinks.length > 0) {
          if (!shareLinks[0].parentNode.matches(':hover')) {
            $(`#${this.id}`)[0].style.display = 'none'
          }
        } else {
          $(`#${this.id}`)[0].style.display = 'none'
        }
      })
    },

    focusOut: function() {
      $(`#${this.id}`).focusout()
      $(`#${this.id}`)[0].style.display = 'none'
      $(`#${this.id}`).attr('aria-expanded', 'false')
    },

    handleIconClick: function (event) {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Tab') {
          return
        }

        event.preventDefault()

        if (event.key !== 'Enter' && event.key !== ' ') {
          return
        }
      }

      if (this.forceDropdown || (this.dropdownNames.length > 0 && this.dropdownValues.length > 0)) {
        this.toggleDropdown()
      } else {
        this.$emit('click')
      }
    },

    handleDropdownClick: function (index, event) {
      if (event instanceof KeyboardEvent) {
        let nextElement = null
        if (event.key === 'Tab') {
          return
        } if (event.key === 'ArrowUp') {
          nextElement = event.target.previousElementSibling
        } else if (event.key === 'ArrowDown') {
          nextElement = event.target.nextElementSibling
        } else if (event.key === 'Home') {
          nextElement = $(`#${this.id} > .listItem`).first()[0]
        } else if (event.key === 'End') {
          nextElement = $(`#${this.id} > .listItem`).last()[0]
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

      const listbox = $(`#${this.id}`)
      const allOptions = listbox.children()

      allOptions.attr('aria-selected', 'false')
      allOptions.attr('tabindex', '-1')
      event.target.setAttribute('aria-selected', 'true')
      event.target.setAttribute('tabindex', '0')

      this.$emit('click', this.dropdownValues[index])
      this.focusOut()
    }
  }
})
