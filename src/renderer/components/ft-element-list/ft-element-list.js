import { defineComponent } from 'vue'
import FtAutoGrid from '../ft-auto-grid/ft-auto-grid.vue'
import FtListLazyWrapper from '../ft-list-lazy-wrapper/ft-list-lazy-wrapper.vue'
import { useSettingsStore } from '../../stores'

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
    showVideoWithLastViewedPlaylist: {
      type: Boolean,
      default: false
    },
  },
  setup() {
    const settingsStore = useSettingsStore()
    return { settingsStore }
  },
  computed: {
    listType: function () {
      return this.settingsStore.listType
    }
  }
})
