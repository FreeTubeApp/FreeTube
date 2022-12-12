import Vue from 'vue'
import { sanitizeForHtmlId, handleDropdownKeyboardEvent } from '../../helpers/accessibility'
export default Vue.extend({
  name: 'FtListDropdown',
  props: {
    title: {
      type: String,
      required: true
    },
    labelNames: {
      type: Array,
      required: true
    },
    labelValues: {
      type: Array,
      required: true
    }
  },
  data: function () {
    return {
      id: '',
      thumbnail: '',
      channelName: '',
      subscriberCount: 0,
      videoCount: '',
      uploadedTime: '',
      description: ''
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    }
  },
  methods: {
    sanitizeForHtmlId,
    handleIconKeyPress() {
      const firstOption = document.getElementById('buttonOption0')
      if (firstOption) {
        firstOption.setAttribute('tabIndex', 1)
        firstOption.focus()
      }
    },
    handleDropdownClick: function(index, event) {
      if (!handleDropdownKeyboardEvent(event, event?.target)) {
        return
      }

      const unspacedTitle = CSS.escape(sanitizeForHtmlId(this.title))
      const allOptions = document.querySelector(`#${unspacedTitle} + ul`)
      allOptions.setAttribute('tabindex', '-1')
      event.target.setAttribute('tabindex', '0')
      this.$emit('click', this.labelValues[index])
    }
  }
})
