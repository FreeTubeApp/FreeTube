import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import $ from 'jquery'

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
    optionNames: {
      type: Array,
      default: () => { return [] }
    },
    optionValues: {
      type: Array,
      default: () => { return [] }
    }
  },
  mounted: function() {
    $('.prompt').find('button')[0].focus()
  },
  methods: {
    handleHide: function (event) {
      if (event.target.getAttribute('role') === 'button' || event.target.className === 'prompt') {
        this.$emit('click', null)
      }
    }
  }
})
