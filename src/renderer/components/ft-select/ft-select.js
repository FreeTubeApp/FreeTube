import { defineComponent, nextTick } from 'vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'
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
    // update the selected value in the menu when the list of values changes

    // e.g. when you change the display language, the locations list gets updated
    // as the locations list is sorted alphabetically for the language, the ordering can be different
    // so we need to ensure that the correct location is selected after a language change
    selectValues: function () {
      nextTick(() => {
        this.$refs.select.value = this.value
      })
    }
  },
  methods: {
    change: function(value) {
      this.$emit('change', value)
    }
  }
})
