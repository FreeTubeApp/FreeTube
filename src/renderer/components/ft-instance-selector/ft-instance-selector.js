import { defineComponent } from 'vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtButton from '../ft-button/ft-button.vue'

export default defineComponent({
  name: 'FtInstanceSelector',
  components: {
    'ft-button': FtButton,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput
  },
  props: {
    placeholder: {
      type: String,
      required: true
    },
    tooltip: {
      type: String,
      required: true
    },
    backendType: {
      type: String,
      required: true
    },
    currentInstance: {
      type: String,
      required: true
    },
    instanceList: {
      type: Array,
      required: true
    },
    defaultInstance: {
      type: String,
      required: true
    }
  },
  emits: ['clearDefaultInstance', 'input', 'setDefaultInstance'],
  methods: {
    handleInstanceInput: function (inputData) {
      this.$emit('input', inputData)
    },
    setDefaultInstance: function () {
      this.$emit('setDefaultInstance')
    },
    clearDefaultInstance: function () {
      this.$emit('clearDefaultInstance')
    }
  }
})
