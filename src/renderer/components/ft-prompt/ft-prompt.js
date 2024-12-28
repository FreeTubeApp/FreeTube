import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'

export default defineComponent({
  name: 'FtPrompt',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton
  },
  props: {
    label: {
      type: String,
      required: true
    },
    extraLabels: {
      type: Array,
      default: () => { return [] }
    },
    optionNames: {
      type: Array,
      default: () => { return [] }
    },
    optionValues: {
      type: Array,
      default: () => { return [] }
    },
    autosize: {
      type: Boolean,
      default: false
    },
    isFirstOptionDestructive: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      default: 'base'
    },
    inert: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  data: function () {
    return {
      promptButtons: [],
      lastActiveElement: null,
    }
  },
  computed: {
    sanitizedLabel: function() {
      return sanitizeForHtmlId(this.label)
    },
  },
  mounted: function () {
    this.lastActiveElement = document.activeElement
    nextTick(() => {
      document.addEventListener('keydown', this.closeEventFunction, true)
      this.promptButtons = Array.from(this.$refs.promptCard.$el.querySelectorAll('.btn.ripple, .iconButton'))
      this.focusItem(0)
    })
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.closeEventFunction, true)
    nextTick(() => this.lastActiveElement?.focus())
  },
  methods: {
    optionButtonTextColor: function(index) {
      if (index === 0 && this.isFirstOptionDestructive) {
        return 'var(--destructive-text-color)'
      } else if (index < this.optionNames.length - 1) {
        return 'var(--text-with-accent-color)'
      } else {
        return null
      }
    },
    optionButtonBackgroundColor: function(index) {
      if (index === 0 && this.isFirstOptionDestructive) {
        return 'var(--destructive-color)'
      } else if (index < this.optionNames.length - 1) {
        return 'var(--accent-color)'
      } else {
        return null
      }
    },
    click: function (value) {
      this.$emit('click', value)
    },
    hide: function() {
      this.$emit('click', null)
    },
    handleHide: function (event) {
      if (event.target.className === 'prompt') {
        this.hide()
      }
    },
    focusItem: function (value) {
      let index = value
      if (index < 0) {
        index = this.promptButtons.length - 1
      } else if (index >= this.promptButtons.length) {
        index = 0
      }
      if (index >= 0 && index < this.promptButtons.length) {
        this.promptButtons[index].focus()
        this.showOutlines()
      }
    },
    // close on escape key and unfocus
    closeEventFunction: function(event) {
      if (event.type === 'keydown' && event.key === 'Escape' && !this.inert) {
        event.preventDefault()
        this.hide()
      }
    },
    arrowKeys: function(e) {
      const currentIndex = this.promptButtons.indexOf(e.target)

      // Only react if a button was focused when the arrow key was pressed
      if (currentIndex === -1) {
        return
      }

      e.preventDefault()

      const direction = (e.key === 'ArrowLeft') ? -1 : 1
      this.focusItem(currentIndex + direction)
    },

    ...mapActions([
      'showOutlines'
    ])
  }
})
