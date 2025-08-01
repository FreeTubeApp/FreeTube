import { defineComponent } from 'vue'
import { mapActions } from 'vuex'

import FtTooltip from '../FtTooltip/FtTooltip.vue'
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
    maxlength: {
      type: Number,
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
    dataList: {
      type: Array,
      default: () => { return [] }
    },
    dataListProperties: {
      type: Array,
      default: () => { return [] }
    },
    searchResultIconNames: {
      type: Array,
      default: null
    },
    showDataWhenEmpty: {
      type: Boolean,
      default: false
    },
    tooltip: {
      type: String,
      default: ''
    }
  },
  emits: ['clear', 'click', 'input', 'remove'],
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
      removeButtonSelectedIndex: -1,
      removalMade: false,
      actionButtonIconName: actionIcon
    }
  },
  computed: {
    showOptions: function () {
      return (this.inputData !== '' || this.showDataWhenEmpty) && this.visibleDataList.length > 0 && this.searchState.showOptions
    },

    barColor: function () {
      return this.$store.getters.getBarColor
    },

    forceTextColor: function () {
      return this.isSearch && this.barColor
    },

    inputDataPresent: function () {
      return this.inputDataDisplayed.length > 0
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
      return this.visibleDataList[this.searchState.keyboardSelectedOptionIndex]
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
  created: function () {
    this.id = this._uid
    this.inputData = this.value
    this.updateVisibleDataList()
  },
  methods: {
    handleClick: function (e) {
      const selectedValue = this.searchStateKeyboardSelectedOptionValue
      const query = (selectedValue != null && selectedValue !== '') ? selectedValue : this.inputData
      this.inputData = query
      // No action if no input text
      if (!this.inputDataPresent) {
        return
      }

      this.searchState.showOptions = false
      this.searchState.selectedOption = -1
      this.searchState.keyboardSelectedOptionIndex = -1
      this.removeButtonSelectedIndex = -1
      this.$emit('input', query)
      this.$emit('click', query, { event: e })
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
      this.searchState.isPointerInList = false

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
            case 'post':
            case 'trending':
            case 'subscriptions':
            case 'history':
            case 'userplaylists':
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
      if (this.removeButtonSelectedIndex !== -1) {
        this.handleRemoveClick(index)
        return
      }
      this.searchState.showOptions = false
      this.inputData = this.visibleDataList[index]
      this.$emit('input', this.inputData)
      this.handleClick()
    },

    handleRemoveClick: function (index) {
      if (!this.dataListProperties[index]?.isRemoveable) { return }

      // keep input in focus even when the to-be-removed "Remove" button was clicked
      this.$refs.input.focus()
      this.removalMade = true
      this.$emit('remove', this.visibleDataList[index])
    },

    /**
     * @param {KeyboardEvent} event
     */
    handleKeyDown: function (event) {
      // Update Input box value if enter key was pressed and option selected
      if (event.key === 'Enter' && !event.isComposing) {
        if (this.removeButtonSelectedIndex !== -1) {
          this.handleRemoveClick(this.removeButtonSelectedIndex)
        } else if (this.searchState.selectedOption !== -1) {
          this.searchState.showOptions = false
          event.preventDefault()
          this.inputData = this.visibleDataList[this.searchState.selectedOption]
          this.handleOptionClick(this.searchState.selectedOption)
        } else {
          this.handleClick(event)
        }

        return
      }

      if (this.visibleDataList.length === 0) { return }

      this.searchState.showOptions = true

      // "select" the Remove button through right arrow navigation, and unselect it with the left arrow
      if (event.key === 'ArrowRight') {
        this.removeButtonSelectedIndex = this.searchState.selectedOption
      } else if (event.key === 'ArrowLeft') {
        this.removeButtonSelectedIndex = -1
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault()
        const newIndex = this.searchState.selectedOption + (event.key === 'ArrowDown' ? 1 : -1)
        this.updateSelectedOptionIndex(newIndex)
      } else {
        const selectedOptionValue = this.searchStateKeyboardSelectedOptionValue
        // Keyboard selected & is char
        if (!isNullOrEmpty(selectedOptionValue) && isKeyboardEventKeyPrintableChar(event.key)) {
          // Update input based on KB selected suggestion value instead of current input value
          event.preventDefault()
          this.handleInput(`${selectedOptionValue}${event.key}`)
        }
      }
    },

    // Updates the selected dropdown option index and handles the under/over-flow behavior
    updateSelectedOptionIndex: function (index) {
      this.searchState.selectedOption = index

      // unset selection of "Remove" button
      this.removeButtonSelectedIndex = -1

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

    handleFocus: function () {
      this.searchState.showOptions = true
    },

    updateVisibleDataList: function () {
      // Reset selected option before it's updated
      // Block resetting if it was just the "Remove" button that was pressed
      if (!this.removalMade || this.searchState.selectedOption >= this.dataList.length) {
        this.searchState.selectedOption = -1
        this.searchState.keyboardSelectedOptionIndex = -1
        this.removeButtonSelectedIndex = -1
      }

      this.removalMade = false

      if (this.inputData.trim() === '') {
        this.visibleDataList = this.dataList
        return
      }
      // get list of items that match input
      const lowerCaseInputData = this.inputData.toLowerCase()

      this.visibleDataList = this.dataList.filter(x => {
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
