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
    setTimeout(() => {
      document.querySelector('.prompt')
        .querySelectorAll('button')[0]
        .focus()
    })
  },
  methods: {
    removeWhitespace,
    handleHide: function (event) {
      if (event.target.getAttribute('role') === 'button' || event.target.className === 'prompt') {
        this.$emit('click', null)
      }
    }
  }
})
