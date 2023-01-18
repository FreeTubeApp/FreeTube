import { defineComponent } from 'vue'
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
      default: ''
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
    showClose: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      promptButtons: []
    }
  },
  computed: {
    sanitizedLabel: function() {
      return sanitizeForHtmlId(this.label)
    }
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.closeEventFunction, true)
  },
  mounted: function () {
    document.addEventListener('keydown', this.closeEventFunction, true)
    document.querySelector('.prompt').addEventListener('keydown', this.arrowKeys, true)
    this.promptButtons = Array.from(
      document.querySelector('.prompt .promptCard .ft-flex-box').childNodes
    ).filter((e) => {
      return e.id && e.id.startsWith('prompt')
    })
    this.focusItem(0)
  },
  methods: {
    hide: function() {
      this.$emit('click', null)
    },
    handleHide: function (event) {
      if (event.target.getAttribute('role') === 'button' || event.target.className === 'prompt') {
        this.hide()
      }
    },
    focusItem: function (value) {
      let index = value
      if (index < 0) {
        index = this.promptButtons.length
      } else if (index >= this.promptButtons.length) {
        index = 0
      }
      if (index >= 0 && index < this.promptButtons.length) {
        this.promptButtons[index].focus({ focusVisible: true })
      }
    },
    // close on escape key and unfocus
    closeEventFunction: function(event) {
      if (event.type === 'keydown' && event.key === 'Escape') {
        event.preventDefault()
        this.hide()
      }
    },
    arrowKeys: function(e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        const currentIndex = this.promptButtons.findIndex((cur) => {
          return cur === e.target
        })
        const direction = (e.key === 'ArrowLeft') ? -1 : 1
        this.focusItem(parseInt(currentIndex) + direction)
      }
    }
  }
})
