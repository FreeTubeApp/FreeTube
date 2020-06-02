import Vue from 'vue'

export default Vue.extend({
  name: 'FtInput',
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
    dataList: {
      type: Array,
      default: () => { return [] }
    },
  },
  data: function () {
    return {
      id: '',
      inputData: ''
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
  mounted: function () {
    this.id = this._uid

    setTimeout(this.addListener, 200)
  },
  methods: {
    handleClick: function () {
      this.$emit('click', this.inputData)
    },

    handleInput: function (input) {
      this.inputData = input
      this.$emit('input', input)
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
    }
  }
})
