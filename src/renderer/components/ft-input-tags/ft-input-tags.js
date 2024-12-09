import { defineComponent } from 'vue'
import FtInput from '../ft-input/ft-input.vue'
import { showToast } from '../../helpers/utils'
import { sanitizeForHtmlId } from '../../helpers/accessibility'

export default defineComponent({
  name: 'FtInputTags',
  components: {
    'ft-input': FtInput,
  },
  props: {
    areChannelTags: {
      type: Boolean,
      default: false
    },
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
    minInputLength: {
      type: Number,
      default: 1
    },
    showActionButton: {
      type: Boolean,
      default: true
    },
    showTags: {
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
  emits: ['already-exists', 'change', 'error-find-tag-info', 'invalid-name', 'toggle-show-tags'],
  computed: {
    sanitizedId: function() {
      return sanitizeForHtmlId(`checkbox-${this.label}`)
    },
  },
  methods: {
    updateTags: async function (text, _e) {
      if (this.areChannelTags) {
        await this.updateChannelTags(text, _e)
        return
      }
      // add tag and update tag list
      const trimmedText = text.trim()

      if (this.minInputLength > trimmedText.length) {
        showToast(this.$tc('Trimmed input must be at least N characters long', this.minInputLength, { length: this.minInputLength }))
        return
      }

      if (this.tagList.includes(trimmedText)) {
        showToast(this.$t('Tag already exists', { tagName: trimmedText }))
        return
      }

      const newList = this.tagList.slice(0)
      newList.push(trimmedText)
      this.$emit('change', newList)
      // clear input box
      this.$refs.tagNameInput.handleClearTextClick()
    },
    updateChannelTags: async function (text, _e) {
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
      if (this.areChannelTags) {
        this.removeChannelTag(tag)
        return
      }
      // Remove tag from list
      const tagName = tag.trim()
      if (this.tagList.includes(tagName)) {
        const newList = this.tagList.slice(0)
        const index = newList.indexOf(tagName)
        newList.splice(index, 1)
        this.$emit('change', newList)
      }
    },
    removeChannelTag: function (tag) {
      // Remove tag from list
      if (this.tagList.some((tmpTag) => tmpTag.name === tag.name)) {
        const newList = this.tagList.filter((tmpTag) => tmpTag.name !== tag.name)
        this.$emit('change', newList)
      }
    },
    toggleShowTags: function () {
      this.$emit('toggle-show-tags')
    },
  }
})
