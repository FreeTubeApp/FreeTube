import { defineComponent } from 'vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'

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
    },
    dropdownModalOnMobile: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      dropdownShown: false,
      mouseDownOnIcon: false,
      useModal: false
    }
  },
  mounted: function () {
    if (this.dropdownModalOnMobile) {
      this.useModal = window.innerWidth <= 900
      window.addEventListener('resize', this.handleResize)
    }
  },
  destroyed: function () {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    sanitizeForHtmlId,
    // used by the share menu
    hideDropdown: function () {
      this.dropdownShown = false
    },

    handleIconClick: function () {
      if (this.forceDropdown || (this.dropdownOptions.length > 0)) {
        this.dropdownShown = !this.dropdownShown

        if (this.dropdownShown && !this.useModal) {
          // wait until the dropdown is visible
          // then focus it so we can hide it automatically when it loses focus
          setTimeout(() => {
            this.$refs.dropdown.focus()
          }, 0)
        }
      } else {
        this.$emit('click')
      }
    },

    handleIconMouseDown: function () {
      if (this.dropdownShown) {
        this.mouseDownOnIcon = true
      }
    },

    handleDropdownFocusOut: function () {
      if (this.mouseDownOnIcon) {
        this.mouseDownOnIcon = false
      } else if (!this.$refs.dropdown.matches(':focus-within')) {
        this.dropdownShown = false
      }
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
    }
  }
})
