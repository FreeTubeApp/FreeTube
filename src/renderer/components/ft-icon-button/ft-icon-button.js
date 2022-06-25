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
    returnIndex: {
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
    dropdownOptions: {
      // Array of objects with these properties
      // - type: ('labelValue'|'divider', default to 'labelValue' for less typing)
      // - label: String (if type == 'labelValue')
      // - value: String (if type == 'labelValue')
      type: Array,
      default: () => { return [] }
    }
  },
  data: function () {
    return {
      dropdownShown: false,
      id: ''
    }
  },
  mounted: function () {
    this.id = `iconButton${this._uid}`
  },
  methods: {
    toggleDropdown: function () {
      const dropdownBox = $(`#${this.id}`)
      if (this.dropdownShown) {
        dropdownBox[0].style.display = 'none'
        this.dropdownShown = false
        return
      }

      dropdownBox[0].style.display = 'inline'
      this.dropdownShown = true

      const firstItem = dropdownBox.find('.listItem')[0]
      if (firstItem) {
        firstItem.tabindex = 0
        firstItem.setAttribute('aria-selected', 'true')
        dropdownBox.attr('aria-expanded', 'true')
        firstItem.focus()
      }

      dropdownBox.on('focusout', (e) => {
        if (dropdownBox.has(e.relatedTarget).length) {
          return
        }

        dropdownBox[0].style.display = 'none'
        dropdownBox.attr('aria-expanded', 'false')

        const shareLinks = dropdownBox.find('.shareLinks')
        if (shareLinks.length > 0) {
          if (!shareLinks[0].parentNode.matches(':hover')) {
            dropdownBox.get(0).style.display = 'none'
            // When pressing the profile button
            // It will make the menu reappear if we set `dropdownShown` immediately
            setTimeout(() => {
              this.dropdownShown = false
            }, 100)
          }
        } else {
          dropdownBox.get(0).style.display = 'none'
          // When pressing the profile button
          // It will make the menu reappear if we set `dropdownShown` immediately
          setTimeout(() => {
            this.dropdownShown = false
          }, 100)
        }
      })
    },

    focusOut: function() {
      const dropdownBox = $(`#${this.id}`)
      dropdownBox.trigger('focusout')
      dropdownBox[0].style.display = 'none'
      this.dropdownShown = false
    },

    handleIconClick: function () {
      if (this.forceDropdown || (this.dropdownOptions.length > 0)) {
        this.toggleDropdown()
      } else {
        this.$emit('click')
      }
    },

    handleDropdownClick: function ({ url, index }, event) {
      if (!this.$handleDropdownKeyboardEvent(event, event?.target)) {
        return
      }

      // const listbox = $(`#${this.id}`)
      // const allOptions = listbox.children()

      // allOptions.attr('aria-selected', 'false')
      // allOptions.attr('tabindex', '-1')
      // event.target.setAttribute('aria-selected', 'true')
      // event.target.setAttribute('tabindex', '0')

      if (this.returnIndex) {
        this.$emit('click', index)
      } else {
        this.$emit('click', url)
      }

      this.focusOut()
    }
  }
})
