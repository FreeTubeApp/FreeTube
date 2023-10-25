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
      default: (_) => '',
    },
    findIcon: {
      type: Function,
      default: (_) => '',
    }
  },
  methods: {
    updateTags: async function (text, _e) {
      // text entered add tag and update tag list
      const name = text.trim()

      if (!this.tagList.some((tag) => tag.name === name)) {
        // secondary name and icon searching allow api calls to be used
        const secondaryName = await this.findSecondaryName(name) ?? ''
        const icon = await this.findIcon(name) ?? ''

        const newList = this.tagList.slice(0)
        newList.push({ name, secondaryName, icon })
        this.$emit('change', newList)
      } else {
        this.$emit('already-exists')
      }

      // clear input boxes
      this.$refs.tagNameInput.handleClearTextClick()
    },
    removeTag: function (tag) {
      // Remove tag from list
      if (this.tagList.some((tmpTag) => tmpTag.name === tag.name)) {
        const newList = this.tagList.filter((tmpTag) => tmpTag.name !== tag.name)
        this.$emit('change', newList)
      }
    }
  }
})
