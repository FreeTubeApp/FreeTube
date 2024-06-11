import { defineComponent } from 'vue'

export default defineComponent({
  name: 'FtCheckboxList',
  props: {
    title: {
      type: String,
      required: true
    },
    labels: {
      type: Array,
      required: true
    },
    values: {
      type: Array,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    initialValues: {
      type: Array,
      required: true
    }
  },
  emits: ['change'],
  data: function () {
    return {
      id: '',
      selectedValues: []
    }
  },
  computed: {
    inputName: function () {
      const name = this.title.replace(' ', '')
      return name.toLowerCase() + this.id
    }
  },
  created: function () {
    this.id = this._uid
    this.selectedValues = this.initialValues
  },
  methods: {
    removeSelectedValues: function() {
      this.selectedValues = []
    },
    change: function(event) {
      const targ = event.target
      if (targ.checked) {
        if (!this.selectedValues.includes(targ.value)) {
          this.selectedValues.push(targ.value)
        }
      } else {
        this.selectedValues = this.selectedValues.filter(e => e !== targ.value)
      }

      this.$emit('change', [...this.selectedValues])
    },
  }
})
