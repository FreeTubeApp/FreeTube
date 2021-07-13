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
      let thisButton = $(`#${this.id}`)
      thisButton.get(0).style.display = 'inline'
      let firstItem = thisButton.find('.listItem').first()
      firstItem.attr('tabindex', '0')
      firstItem.attr('aria-selected', true)
      thisButton.attr('aria-activedescendant', firstItem.attr('id'))
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
    },

    handleIconClick: function (event) {
      if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') {
        return
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
          nextElement = $(`#${this.id} > .listItem`).first()
        } else if (event.key === 'End') {
          nextElement = $(`#${this.id} > .listItem`).last()
        }

        event.preventDefault()

        if (nextElement) {
          event.target.setAttribute('tabindex', '-1')
          event.target.setAttribute('aria-selected', 'false')
          nextElement.setAttribute('tabindex', '0')
          nextElement.setAttribute('aria-selected', 'true')
          $(`#${this.id}`).attr('aria-activedescendant', nextElement.id)
          nextElement.focus()
        }

        if (event.key !== 'Enter' && event.key !== ' ') {
          return
        }
      }

      this.$emit('click', this.dropdownValues[index])
      $(`#${this.id}`).focusout()
    }
  }
})
