import Vue from 'vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'
import { mapActions } from 'vuex'

export default Vue.extend({
  name: 'FtInput',
  components: {
    'ft-tooltip': FtTooltip
  },
  props: {
    placeholder: {
      type: String,
      required: true
    },
    value: {
      type: String,
      default: ''
    },
    showActionButton: {
      type: Boolean,
      default: true
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
    selectOnFocus: {
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
  data: function () {
    return {
      id: '',
      inputData: '',
      searchState: {
        showOptions: false,
        selectedOption: -1,
        isPointerInList: false
      },
      visibleDataList: this.dataList,
      // This button should be invisible on app start
      // As the text input box should be empty
      clearTextButtonExisting: false,
      clearTextButtonVisible: false,
      actionButtonIconName: ['fas', 'search']
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
    }
  },
  mounted: function () {
    this.id = this._uid
    this.inputData = this.value
    this.updateVisibleDataList()

    setTimeout(this.addListener, 200)
  },
  methods: {
    handleClick: function (e) {
      // No action if no input text
      if (!this.inputDataPresent) { return }

      this.searchState.showOptions = false
      this.$emit('input', this.inputData)
      this.$emit('click', this.inputData, { event: e })
    },

    handleInput: function (val) {
      if (this.isSearch &&
        this.searchState.selectedOption !== -1 &&
        this.inputData === this.visibleDataList[this.searchState.selectedOption]) { return }
      this.handleActionIconChange()
      this.updateVisibleDataList()
      this.$emit('input', val)
    },

    handleClearTextClick: function () {
      // No action if no input text
      if (!this.inputDataPresent) { return }

      this.inputData = ''
      this.handleActionIconChange()
      this.updateVisibleDataList()

      const inputElement = document.getElementById(this.id)
      inputElement.value = ''

      // Focus on input element after text is clear for better UX
      inputElement.focus()

      this.$emit('clear')
    },

    handleActionIconChange: function() {
      // Only need to update icon if visible
      if (!this.showActionButton) { return }

      if (!this.inputDataPresent) {
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
              isYoutubeLink = true
              break
            case 'hashtag':
              // TODO: Implement a hashtag related view
              // isYoutubeLink is already `false`
              break

            case 'invalid_url':
            default: {
              // isYoutubeLink is already `false`
            }
          }

          if (isYoutubeLink) {
            // Go to URL (i.e. Video/Playlist/Channel
            this.actionButtonIconName = ['fas', 'arrow-right']
          } else {
            // Search with text
            this.actionButtonIconName = ['fas', 'search']
          }
        })
      } catch (ex) {
        // On exception, consider text as invalid URL
        this.actionButtonIconName = ['fas', 'search']
        // Rethrow exception
        throw ex
      }
    },

    addListener: function () {
      const inputElement = document.getElementById(this.id)

      if (inputElement !== null) {
        inputElement.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            this.handleClick(event)
          }
        })
      }
    },

    handleOptionClick: function (index) {
      this.searchState.showOptions = false
      this.inputData = this.visibleDataList[index]
      this.$emit('input', this.inputData)
      this.handleClick()
    },

    handleKeyDown: function (event) {
      if (this.visibleDataList.length === 0) { return }
      // Update selectedOption based on arrow key pressed
      if (event.key === 'ArrowDown') {
        this.searchState.selectedOption = (this.searchState.selectedOption + 1) % this.visibleDataList.length
      } else if (event.key === 'ArrowUp') {
        if (this.searchState.selectedOption < 1) {
          this.searchState.selectedOption = this.visibleDataList.length - 1
        } else {
          this.searchState.selectedOption--
        }
      } else {
        this.searchState.selectedOption = -1
      }

      // Key pressed isn't enter
      if (event.key !== 'Enter') {
        this.searchState.showOptions = true
      }
      // Update Input box value if arrow keys were pressed
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && this.searchState.selectedOption !== -1) {
        event.preventDefault()
        this.inputData = this.visibleDataList[this.searchState.selectedOption]
      }
    },

    handleInputBlur: function () {
      if (!this.searchState.isPointerInList) { this.searchState.showOptions = false }
    },

    handleFocus: function(e) {
      this.searchState.showOptions = true
      if (this.selectOnFocus) {
        e.target.select()
      }
    },

    updateVisibleDataList: function () {
      if (this.dataList.length === 0) { return }
      if (this.inputData === '') {
        this.visibleDataList = this.dataList
        return
      }
      // get list of items that match input
      const visList = this.dataList.filter(x => {
        if (x.toLowerCase().indexOf(this.inputData.toLowerCase()) !== -1) {
          return true
        } else {
          return false
        }
      })

      this.visibleDataList = visList
    },

    ...mapActions([
      'getYoutubeUrlInfo'
    ])
  }
})
