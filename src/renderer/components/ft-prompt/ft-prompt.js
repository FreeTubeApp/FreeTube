import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import { removeWhitespace } from '../../helpers/accessibility'

export default Vue.extend({
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
    }
  },
  mounted: function () {
    this.focusItem(0)
  },
  methods: {
    removeWhitespace,
    hide: function() {
      this.$emit('click', null)
    },
    handleHide: function (event) {
      if (event.target.getAttribute('role') === 'button' || event.target.className === 'prompt') {
        this.hide()
      }
    },
    focusItem: function (index) {
      document.querySelector(`#prompt-${removeWhitespace(this.label)}-${index}`)
        .focus({ focusVisible: true })
    }
  }
})
