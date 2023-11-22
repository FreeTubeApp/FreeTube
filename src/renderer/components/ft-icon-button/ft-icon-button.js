import { defineComponent } from 'vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'

export default defineComponent({
  name: 'FtIconButton',
  components: {
    'ft-button': FtButton,
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
      // - type: ('labelValue'|'divider'|'radiogroup', default to 'labelValue' for less typing)
      // - radios: ({ type?: 'radio', label: String, value: String, checked: Boolean } | { type: divider })[]
      //          (if type == 'radiogroup', representing a separate group of checkboxes)
      // - label: String (if type == 'labelValue')
      // - value: String (if type == 'labelValue')
      type: Array,
      default: () => { return [] }
    },
    dropdownModalOnMobile: {
      type: Boolean,
      default: false
    },
    closeOnClick: {
      type: Boolean,
      default: true
    },
    hideIcon: {
      type: Boolean,
      default: false
    },
    useFtButton: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      dropdownShown: false,
      useModal: false
    }
  },
  computed: {
    id: function () {
      return sanitizeForHtmlId(`iconButton-${this.title}`)
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

    handleIconClick: function () {
      if (this.forceDropdown || (this.dropdownOptions.length > 0)) {
        this.dropdownShown = !this.dropdownShown

        if (this.dropdownShown && !this.useModal) {
          // wait until the dropdown is visible
          // then focus it so we can hide it automatically when it loses focus
          setTimeout(() => {
            this.$refs.dropdown?.focus()
          })
        }
      } else {
        this.$emit('click')
      }
    },

    handleDropdownFocusOut: function () {
      if (this.dropdownShown && !this.$refs.iconButton.matches(':focus-within')) {
        this.dropdownShown = false
      }
    },

    handleDropdownClick: function ({ url, index }) {
      if (this.returnIndex) {
        this.$emit('click', index)
      } else {
        this.$emit('click', url)
      }

      if (this.closeOnClick) {
        this.dropdownShown = false
      }
    },

    handleRadioDropdownKeydown: function({ url, index, groupIndex }, event) {
      if (!(event instanceof KeyboardEvent) || event.altKey) {
        return
      }

      let isNext = null
      switch (event.key) {
        case ' ':
        case 'Spacebar':
          this.handleDropdownClick({ url, index })
          return
        case 'ArrowRight':
        case 'ArrowDown':
          isNext = true
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          isNext = false
          break
        default:
          return
      }

      this.focusElement(
        {
          isNext,
          index,
          list: this.dropdownOptions[groupIndex].radios,
          idPrefix: this.title,
          groupIndex
        }
      )
    },

    focusElement: function ({ isNext, index, list, idPrefix, groupIndex }) {
      let newIndex = index
      const max = list.length - 1
      do {
        newIndex += (isNext ? 1 : -1)
        if (newIndex === -1) {
          newIndex = max
        } else if (newIndex > max) {
          newIndex = 0
        }
      } while (list[newIndex].type === 'divider')
      const newElement = document.getElementById(sanitizeForHtmlId(idPrefix + groupIndex + '-' + newIndex))
      newElement?.focus()
    },

    handleResize: function () {
      this.useModal = window.innerWidth <= 900
    }
  }
})
