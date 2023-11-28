import { defineComponent } from 'vue'
import FtInput from '../ft-input/ft-input.vue'

export default defineComponent({
  name: 'FtInputTags',
  components: {
    'ft-input': FtInput,
  },
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    disabledMsg: {
      type: String,
      default: ''
    },
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
    validateTagName: {
      type: Function,
      default: (_) => true
    },
    findTagInfo: {
      type: Function,
      default: (_) => ({ preferredName: '', icon: '' }),
    }
  },
  methods: {
    updateTags: async function (text, _e) {
      // get text without spaces after last '/' in url, if any
      const name = text.split('/').pop().trim()

      if (!this.validateTagName(name)) {
        this.$emit('invalid-name')
        return
      }

      if (!this.tagList.some((tag) => tag.name === name)) {
        // tag info searching allow api calls to be used
        const { preferredName, icon, iconHref, err } = await this.findTagInfo(name)

        if (err) {
          this.$emit('error-find-tag-info')
          return
        }

        const newTag = { name, preferredName, icon, iconHref }
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
