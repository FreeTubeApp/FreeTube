import { defineComponent } from 'vue'
import { mapActions } from 'vuex'

import FtTooltip from '../ft-tooltip/ft-tooltip.vue'
import { isKeyboardEventKeyPrintableChar, isNullOrEmpty } from '../../helpers/strings'

export default defineComponent({
  name: 'FtInput',
  components: {
    'ft-tooltip': FtTooltip
  },
  props: {
    inputType: {
      type: String,
      required: false,
      default: 'text'
    },
    placeholder: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: null
    },
    value: {
      type: String,
      default: ''
    },
    showActionButton: {
      type: Boolean,
      default: true
    },
    forceActionButtonIconName: {
      type: Array,
      default: null
    },
    showClearTextButton: {
      type: Boolean,
      default: false
    },
    showLabel: {
      type: Boolean,
      default: false
    },
    isSearch: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    spellcheck: {
      type: Boolean,
      default: true
    },
    dataList: {
      type: Array,
      default: () => { return [] }
    },
    tooltip: {
      type: String,
      default: ''
    }
  },
  emits: ['clear', 'click', 'input'],
  data: function () {
    let actionIcon = ['fas', 'search']
    if (this.forceActionButtonIconName !== null) {
      actionIcon = this.forceActionButtonIconName
    }
    return {
      id: '',
      inputData: '',
      searchState: {
        showOptions: false,
        selectedOption: -1,
        isPointerInList: false,
        keyboardSelectedOptionIndex: -1,
      },
      visibleDataList: this.dataList,
      // This button should be invisible on app start
      // As the text input box should be empty
      clearTextButtonExisting: false,
      clearTextButtonVisible: false,
      actionButtonIconName: actionIcon
    }
  },
  computed: {
    barColor: function () {
      return this.$store.getters.getBarColor
    },

    forceTextColor: function () {
      return this.isSearch && this.barColor
    },

    idDataList: function () {
      return `${this.id}_datalist`
    },

    inputDataPresent: function () {
      return this.inputData.length > 0
    },
    inputDataDisplayed() {
      if (!this.isSearch) { return this.inputData }

      const selectedOptionValue = this.searchStateKeyboardSelectedOptionValue
      if (selectedOptionValue != null && selectedOptionValue !== '') {
        return selectedOptionValue
      }

      return this.inputData
    },

    searchStateKeyboardSelectedOptionValue() {
      if (this.searchState.keyboardSelectedOptionIndex === -1) { return null }
      return this.getTextForArrayAtIndex(this.visibleDataList, this.searchState.keyboardSelectedOptionIndex)
    },
  },
  watch: {
    dataList(val, oldVal) {
      if (val !== oldVal) {
        this.updateVisibleDataList()
      }
    },
    inputData(val, oldVal) {
      if (val !== oldVal) {
        this.updateVisibleDataList()
      }
    },
    value(val, oldVal) {
      if (val !== oldVal) {
        this.inputData = val
      }
    }
  },
  mounted: function () {
    this.id = this._uid
    this.inputData = this.value
    this.updateVisibleDataList()
  },
  methods: {
    getTextForArrayAtIndex: function (array, index) {
      return array[index].bookmarkName ?? array[index]
    },
    handleClick: function (e) {
      // No action if no input text
      if (!this.inputDataPresent) {
        return
      }

      this.searchState.showOptions = false
      this.searchState.selectedOption = -1
      this.searchState.keyboardSelectedOptionIndex = -1
      this.$emit('input', this.inputData)
      this.$emit('click', this.inputData, { event: e })
    },

    handleInput: function (val) {
      this.inputData = val

      if (this.isSearch &&
        this.searchState.selectedOption !== -1 &&
        this.inputData === this.visibleDataList[this.searchState.selectedOption]) { return }
      this.handleActionIconChange()
      this.$emit('input', val)
    },

    handleClearTextClick: function () {
      // No action if no input text
      if (!this.inputDataPresent) { return }

      this.inputData = ''
      this.handleActionIconChange()
      this.updateVisibleDataList()

      this.$refs.input.value = ''

      // Focus on input element after text is clear for better UX
      this.$refs.input.focus()

      this.$emit('clear')
    },

    handleActionIconChange: function() {
      // Only need to update icon if visible
      if (!this.showActionButton) { return }

      if (!this.inputDataPresent && this.forceActionButtonIconName === null) {
        // Change back to default icon if text is blank
        this.actionButtonIconName = ['fas', 'search']
        return
      }

      // Update action button icon according to input
      try {
        this.getYoutubeUrlInfo(this.inputData).then((result) => {
          let isYoutubeLink = false

          switch (result.urlType) {
            case 'video':
            case 'playlist':
            case 'search':
            case 'channel':
            case 'hashtag':
              isYoutubeLink = true
              break

            case 'invalid_url':
            default: {
              // isYoutubeLink is already `false`
            }
          }
          if (this.forceActionButtonIconName === null) {
            if (isYoutubeLink) {
              // Go to URL (i.e. Video/Playlist/Channel
              this.actionButtonIconName = ['fas', 'arrow-right']
            } else {
              // Search with text
              this.actionButtonIconName = ['fas', 'search']
            }
          }
        })
      } catch (ex) {
        // On exception, consider text as invalid URL
        if (this.forceActionButtonIconName === null) {
          this.actionButtonIconName = ['fas', 'search']
        }
        // Rethrow exception
        throw ex
      }
    },

    handleOptionClick: function (index) {
      this.searchState.showOptions = false
      if (this.visibleDataList[index].route) {
        this.inputData = `ft:${this.visibleDataList[index].route}`
      } else {
        this.inputData = this.visibleDataList[index]
      }
      this.$emit('input', this.inputData)
      this.handleClick()
    },

    /**
     * @param {KeyboardEvent} event
     */
    handleKeyDown: function (event) {
      if (event.key === 'Enter') {
        // Update Input box value if enter key was pressed and option selected
        if (this.searchState.selectedOption !== -1) {
          this.searchState.showOptions = false
          event.preventDefault()
          this.inputData = this.getTextForArrayAtIndex(this.visibleDataList, this.searchState.selectedOption)
          this.handleOptionClick(this.searchState.selectedOption)
        } else {
          this.handleClick(event)
        }
        // Early return
        return
      }

      if (this.visibleDataList.length === 0) { return }

      this.searchState.showOptions = true
      const isArrow = event.key === 'ArrowDown' || event.key === 'ArrowUp'
      if (!isArrow) {
        const selectedOptionValue = this.searchStateKeyboardSelectedOptionValue
        // Keyboard selected & is char
        if (!isNullOrEmpty(selectedOptionValue) && isKeyboardEventKeyPrintableChar(event.key)) {
          // Update input based on KB selected suggestion value instead of current input value
          event.preventDefault()
          this.handleInput(`${selectedOptionValue}${event.key}`)
          return
        }
        return
      }

      event.preventDefault()
      if (event.key === 'ArrowDown') {
        this.searchState.selectedOption++
      } else if (event.key === 'ArrowUp') {
        this.searchState.selectedOption--
      }
      // Allow deselecting suggestion
      if (this.searchState.selectedOption < -1) {
        this.searchState.selectedOption = this.visibleDataList.length - 1
      } else if (this.searchState.selectedOption > this.visibleDataList.length - 1) {
        this.searchState.selectedOption = -1
      }
      // Update displayed value
      this.searchState.keyboardSelectedOptionIndex = this.searchState.selectedOption
    },

    handleInputBlur: function () {
      if (!this.searchState.isPointerInList) { this.searchState.showOptions = false }
    },

    handleFocus: function(e) {
      this.searchState.showOptions = true
    },

    updateVisibleDataList: function () {
      if (this.dataList.length === 0) { return }
      // Reset selected option before it's updated
      this.searchState.selectedOption = -1
      this.searchState.keyboardSelectedOptionIndex = -1
      if (this.inputData === '') {
        this.visibleDataList = this.dataList
        return
      }
      // get list of items that match input
      const lowerCaseInputData = this.inputData.toLowerCase()

      this.visibleDataList = this.dataList.filter(x => {
        if (x.bookmarkName) {
          return x.bookmarkName.toLowerCase().indexOf(lowerCaseInputData) !== -1
        }

        return x.toLowerCase().indexOf(lowerCaseInputData) !== -1
      })
    },

    updateInputData: function(text) {
      this.inputData = text
    },

    focus() {
      this.$refs.input.focus()
    },

    select() {
      this.$refs.input.select()
    },

    blur() {
      this.$refs.input.blur()
    },

    ...mapActions([
      'getYoutubeUrlInfo'
    ])
  }
})
