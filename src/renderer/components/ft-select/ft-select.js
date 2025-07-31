import { defineComponent } from 'vue'
import FtTooltip from '../FtTooltip/FtTooltip.vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'

export default defineComponent({
  name: 'FtSelect',
  components: {
    'ft-tooltip': FtTooltip
  },
  props: {
    placeholder: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      required: true
    },
    selectNames: {
      type: Array,
      required: true
    },
    selectValues: {
      type: Array,
      required: true
    },
    tooltip: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    sanitizedId: {
      type: String,
      default: null
    },
    describeById: {
      type: String,
      default: null
    },
    icon: {
      type: Array,
      required: true
    },
    iconColor: {
      type: String,
      default: null
    },
    isLocaleSelector: {
      type: Boolean,
      default: false
    }
  },
  emits: ['change'],
  computed: {
    sanitizedPlaceholder: function() {
      return sanitizeForHtmlId(this.placeholder)
    }
  },
  watch: {
    value(newVal) {
      if (this.$refs.select) {
        this.$refs.select.value = newVal
      }
    },
    selectValues() {
      this.$nextTick(() => {
        if (this.$refs.select) {
          this.$refs.select.value = this.value
        }
      })
    }
  },
  methods: {
    change: function(value) {
      this.$emit('change', value)
    }
  }
})
