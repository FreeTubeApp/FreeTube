import { defineComponent, nextTick } from 'vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'

const LONG_CLICK_BOUNDARY_MS = 500

export default defineComponent({
  name: 'FtIconButton',
  components: {
    'ft-prompt': FtPrompt
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    icon: {
      type: Array,
      default: () => ['fas', 'ellipsis-v']
    },
    disabled: {
      type: Boolean,
      default: false
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
      // - label: String (if type === 'labelValue')
      // - value: String (if type === 'labelValue')
      // - (OPTIONAL) active: Number (if type === 'labelValue')
      type: Array,
      default: () => { return [] }
    },
    dropdownModalOnMobile: {
      type: Boolean,
      default: false
    },
    openOnRightOrLongClick: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click', 'disabled-click'],
  data: function () {
    return {
      dropdownShown: false,
      blockLeftClick: false,
      longPressTimer: null,
      useModal: false
    }
  },
  mounted: function () {
    if (this.dropdownModalOnMobile) {
      this.useModal = window.innerWidth <= 900
      window.addEventListener('resize', this.handleResize)
    }
  },
  beforeDestroy: function () {
    if (this.dropdownModalOnMobile) {
      window.removeEventListener('resize', this.handleResize)
    }
  },
  methods: {
    sanitizeForHtmlId,
    // used by the share menu
    hideDropdown: function () {
      this.dropdownShown = false
    },

    handleIconClick: function (e, isRightOrLongClick = false) {
      if (this.disabled) {
        this.$emit('disabled-click')
        return
      }

      if (this.blockLeftClick) {
        return
      }

      if (this.longPressTimer != null) {
        clearTimeout(this.longPressTimer)
        this.longPressTimer = null
      }

      if ((!this.openOnRightOrLongClick || (this.openOnRightOrLongClick && isRightOrLongClick)) &&
       (this.forceDropdown || this.dropdownOptions.length > 0)) {
        this.dropdownShown = !this.dropdownShown
        if (this.dropdownShown && !this.useModal) {
          // wait until the dropdown is visible
          // then focus it so we can hide it automatically when it loses focus
          nextTick(() => {
            this.$refs.dropdown?.focus()
          })
        }
      } else {
        this.$emit('click')
      }
    },

    handleIconPointerDown: function (event) {
      if (!this.openOnRightOrLongClick) { return }
      if (event.button === 2) { // right button click
        this.handleIconClick(null, true)
      } else if (event.button === 0) { // left button click
        this.longPressTimer = setTimeout(() => {
          this.handleIconClick(null, true)

          // prevent a long press that ends on the icon button from firing the handleIconClick handler
          window.addEventListener('pointerup', this.preventButtonClickAfterLongPress, { once: true })
          window.addEventListener('pointercancel', () => {
            window.removeEventListener('pointerup', this.preventButtonClickAfterLongPress)
          }, { once: true })
        }, LONG_CLICK_BOUNDARY_MS)
      }
    },

    // prevent the handleIconClick handler from firing for an instant
    preventButtonClickAfterLongPress: function () {
      this.blockLeftClick = true
      setTimeout(() => { this.blockLeftClick = false }, 0)
    },

    handleDropdownFocusOut: function () {
      if (!this.useModal && this.dropdownShown && !this.$refs.ftIconButton.matches(':focus-within')) {
        this.dropdownShown = false
      }
    },

    handleDropdownEscape: function () {
      this.dropdownShown = false
      this.$refs.ftIconButton.firstElementChild.focus()
    },

    handleDropdownClick: function ({ url, index }) {
      if (this.returnIndex) {
        this.$emit('click', index)
      } else {
        this.$emit('click', url)
      }

      this.dropdownShown = false
    },

    handleResize: function () {
      this.useModal = window.innerWidth <= 900
    },

    focus() {
      // To be called by parent components
      this.$refs.iconButton.focus()
    },
  }
})
