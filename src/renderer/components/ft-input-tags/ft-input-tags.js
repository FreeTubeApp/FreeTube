import { defineComponent } from 'vue'
import FtInput from '../ft-input/ft-input.vue'

export default defineComponent({
  name: 'FtInputTags',
  components: {
    'ft-input': FtInput,
  },
  props: {
    tagNamePlaceholder: {
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
    findTagInfo: {
      type: Function,
      default: (_) => ({ preferredName: '', icon: '' }),
    }
  },
  methods: {
    updateTags: async function (text, _e) {
      // text entered add tag and update tag list
      const name = text.trim()

      if (!this.tagList.some((tag) => tag.name === name)) {
        // tag info searching allow api calls to be used
        const { preferredName, icon } = await this.findTagInfo(name)
        const newTag = { name, preferredName, icon }
        this.$emit('change', [...this.tagList, newTag])
      } else {
        this.$emit('already-exists')
      }

      // clear input box
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
