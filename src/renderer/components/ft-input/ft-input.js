import Vue from 'vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'

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
    showArrow: {
      type: Boolean,
      default: true
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
      }
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
    }
  },
  watch: {
    value: function (val) {
      this.inputData = val
    }
  },
  mounted: function () {
    this.id = this._uid
    this.inputData = this.value

    setTimeout(this.addListener, 200)
  },
  methods: {
    handleClick: function () {
      this.searchState.showOptions = false
      this.$emit('input', this.inputData)
      this.$emit('click', this.inputData)
    },

    handleInput: function () {
      if (this.isSearch &&
        this.searchState.selectedOption !== -1 &&
        this.inputData === this.dataList[this.searchState.selectedOption]) { return }
      this.$emit('input', this.inputData)
    },

    addListener: function () {
      const inputElement = document.getElementById(this.id)

      if (inputElement !== null) {
        inputElement.addEventListener('keydown', (event) => {
          if (event.keyCode === 13) {
            this.handleClick()
          }
        })
      }
    },

    handleOptionClick: function (index) {
      this.searchState.showOptions = false
      this.inputData = this.dataList[index]
      this.$emit('input', this.inputData)
      this.handleClick()
    },

    handleKeyDown: function (keyCode) {
      if (this.dataList.length === 0) { return }

      // Update selectedOption based on arrow key pressed
      if (keyCode === 40) {
        this.searchState.selectedOption = (this.searchState.selectedOption + 1) % this.dataList.length
      } else if (keyCode === 38) {
        if (this.searchState.selectedOption === -1) {
          this.searchState.selectedOption = this.dataList.length - 1
        } else {
          this.searchState.selectedOption--
        }
      } else {
        this.searchState.selectedOption = -1
      }

      // Update Input box value if arrow keys were pressed
      if ((keyCode === 40 || keyCode === 38) && this.searchState.selectedOption !== -1) { this.inputData = this.dataList[this.searchState.selectedOption] }
    },

    handleInputBlur: function () {
      if (!this.searchState.isPointerInList) { this.searchState.showOptions = false }
    },

    handleFocus: function(e) {
      this.searchState.showOptions = true
      if (this.selectOnFocus) {
        e.target.select()
      }
    }
  }
})
