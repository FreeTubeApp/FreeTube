import { defineComponent } from 'vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'

export default defineComponent({
  name: 'FtInputTags',
  components: {
    'ft-button': FtButton,
    'ft-input': FtInput,
    'ft-tooltip': FtTooltip
  },
  props: {
    tagNamePlaceholder: {
      type: String,
      required: true
    },
    tagDescPlaceholder: {
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
    },
    includeTagDesc: {
      type: Boolean,
      default: false
    },
    findSecondaryName: {
      type: Function,
      default: async (_) => '',
    }
  },
  methods: {
    updateTags: async function (text, _) {
      // text entered add tag and update tag list
      const name = text.trim()

      if (!this.tagList.some((tag) => tag.name === name)) {
        const secondaryName = await this.findSecondaryName(name)
        const description = this.$refs.tagDescInput.inputData.trim()

        const newList = this.tagList.slice(0)
        newList.push({ name, secondaryName, description })
        this.$emit('change', newList)
      }

      // clear input boxes
      this.$refs.tagNameInput.handleClearTextClick()
      this.$refs.tagDescInput.handleClearTextClick()
    },
    removeTag: function (tag) {
      // Remove tag from list
      const tagName = tag.trim()
      if (this.tagList.some((tag) => tag.name === tagName)) {
        const newList = this.tagList.slice(0)
        const index = newList.indexOf(tagName)
        newList.splice(index, 1)
        this.$emit('change', newList)
      }
    }
  }
})
