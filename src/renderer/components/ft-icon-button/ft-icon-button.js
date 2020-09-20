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
      $(`#${this.id}`)[0].style.display = 'inline'
      $(`#${this.id}`).focus()

      $(`#${this.id}`).focusout(() => {
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

    focusOut: function () {
      $(`#${this.id}`).focusout()
      $(`#${this.id}`)[0].style.display = 'none'
    },

    handleIconClick: function () {
      if (this.forceDropdown || (this.dropdownNames.length > 0 && this.dropdownValues.length > 0)) {
        this.toggleDropdown()
      } else {
        this.$emit('click')
      }
    },

    handleDropdownClick: function (index) {
      this.$emit('click', this.dropdownValues[index])
      this.focusOut()
    }
  }
})
