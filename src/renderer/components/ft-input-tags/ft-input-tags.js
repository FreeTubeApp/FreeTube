import { defineComponent } from 'vue'
import FtInput from '../ft-input/ft-input.vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'

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
      if (!this.tagList.includes(text.trim())) {
        const newList = this.tagList.slice(0)
        newList.push(text.trim())
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
