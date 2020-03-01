import Vue from 'vue'

export default Vue.extend({
  name: 'FtInput',
  props: {
    placeholder: {
      type: String,
      required: true
    },
    showArrow: {
      type: Boolean,
      default: true
    },
    isSearch: {
      type: Boolean,
      default: false
    }
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
