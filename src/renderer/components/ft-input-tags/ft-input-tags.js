import { defineComponent } from 'vue'
import FtInput from '../ft-input/ft-input.vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'
import { showToast } from '../../helpers/utils'

export default defineComponent({
  name: 'FtInputTags',
  components: {
    'ft-input': FtInput,
    'ft-tooltip': FtTooltip
  },
  props: {
    placeholder: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    minTagLength: {
      type: Number,
      default: 1
    },
    showActionButton: {
      type: Boolean,
      default: true
    },
    tagList: {
      type: Array,
      default: () => { return [] }
    },
    tooltip: {
      type: String,
      default: ''
    }
  },
  methods: {
    updateTags: function (text, e) {
      // text entered add tag and update tag list
      const trimmedText = text.trim()

      if (trimmedText && trimmedText.length < this.minTagLength) {
        showToast(this.$t('Global.Input Tags.Length Requirement', { number: this.minTagLength }))
        return
      }

      if (!this.tagList.includes(trimmedText)) {
        const newList = this.tagList.slice(0)
        newList.push(trimmedText)
        this.$emit('change', newList)
      }
      // clear input box
      this.$refs.childinput.handleClearTextClick()
    },
    removeTag: function (tag) {
      // Remove tag from list
      const tagName = tag.trim()
      if (this.tagList.includes(tagName)) {
        const newList = this.tagList.slice(0)
        const index = newList.indexOf(tagName)
        newList.splice(index, 1)
        this.$emit('change', newList)
      }
    }
  }
})
