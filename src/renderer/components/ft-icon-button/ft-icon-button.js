import Vue from 'vue'
import $ from 'jquery'

export default Vue.extend({
  name: 'FtIconButton',
  props: {
    title: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'ellipsis-v'
    },
    theme: {
      type: String,
      default: 'base'
    },
    useShadow: {
      type: Boolean,
      default: true
    },
    padding: {
      type: Number,
      default: 10
    },
    size: {
      type: Number,
      default: 20
    },
    forceDropdown: {
      type: Boolean,
      default: false
    },
    dropdownPositionX: {
      type: String,
      default: 'center'
    },
    dropdownPositionY: {
      type: String,
      default: 'bottom'
    },
    dropdownNames: {
      type: Array,
      default: () => { return [] }
    },
    dropdownValues: {
      type: Array,
      default: () => { return [] }
    },
    relatedVideoTitle: {
      type: String,
      default: () => { return '' },
      require: false
    }
  },
  data: function () {
    return {
      dropdownShown: false,
      id: ''
    }
  },
  computed: {
    filesExtensions: function() {
      const regex = /\/(\w*)/i
      return this.dropdownNames.slice().map((el) => {
        const group = el.match(regex)
        if (group === null || group.length === 0) {
          return ''
        }
        return group[1]
      })
    }
  },
  mounted: function () {
    this.id = `iconButton${this._uid}`
  },
  methods: {
    toggleDropdown: function () {
      const dropdownBox = $(`#${this.id}`)

      if (this.dropdownShown) {
        dropdownBox.get(0).style.display = 'none'
        this.dropdownShown = false
      } else {
        dropdownBox.get(0).style.display = 'inline'
        dropdownBox.get(0).focus()
        this.dropdownShown = true

        dropdownBox.focusout(() => {
          const shareLinks = dropdownBox.find('.shareLinks')

          if (shareLinks.length > 0) {
            if (!shareLinks[0].parentNode.matches(':hover')) {
              dropdownBox.get(0).style.display = 'none'
              // When pressing the profile button
              // It will make the menu reappear if we set `dropdownShown` immediately
              setTimeout(() => {
                this.dropdownShown = false
              }, 100)
            }
          } else {
            dropdownBox.get(0).style.display = 'none'
            // When pressing the profile button
            // It will make the menu reappear if we set `dropdownShown` immediately
            setTimeout(() => {
              this.dropdownShown = false
            }, 100)
          }
        })
      }
    },

    focusOut: function () {
      const dropdownBox = $(`#${this.id}`)

      dropdownBox.focusout()
      dropdownBox.get(0).style.display = 'none'
      this.dropdownShown = false
    },

    handleIconClick: function () {
      if (this.forceDropdown || (this.dropdownNames.length > 0 && this.dropdownValues.length > 0)) {
        this.toggleDropdown()
      } else {
        this.$emit('click')
      }
    },

    handleDropdownClick: function (index) {
      if (this.relatedVideoTitle !== '') {
        this.$emit('click', {
          url: this.dropdownValues[index],
          title: this.relatedVideoTitle,
          extension: this.filesExtensions[index],
          folderPath: this.$store.getters.getDownloadFolderPath
        })
      } else {
        this.$emit('click', this.dropdownValues[index])
      }
      this.focusOut()
    }
  }
})
