import { defineComponent } from 'vue'
import FtAutoGrid from '../ft-auto-grid/ft-auto-grid.vue'
import FtListLazyWrapper from '../ft-list-lazy-wrapper/ft-list-lazy-wrapper.vue'

export default defineComponent({
  name: 'FtElementList',
  components: {
    'ft-auto-grid': FtAutoGrid,
    'ft-list-lazy-wrapper': FtListLazyWrapper
  },
  props: {
    data: {
      type: Array,
      required: true
    },
    dataType: {
      type: String,
      default: null,
    },
    display: {
      type: String,
      required: false,
      default: ''
    },
    showVideoWithLastViewedPlaylist: {
      type: Boolean,
      default: false
    },
    useChannelsHiddenPreference: {
      type: Boolean,
      default: true,
    },
    hideForbiddenTitles: {
      type: Boolean,
      default: true
    },
    searchQueryText: {
      type: String,
      required: false,
      default: '',
    },
    quickBookmarkButtonEnabled: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    },

    displayValue: function () {
      return this.display === '' ? this.listType : this.display
    }
  }
})
