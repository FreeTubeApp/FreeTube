import { defineComponent } from 'vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'

export default defineComponent({
  name: 'ChannelHome',
  components: {
    'ft-element-list': FtElementList,
  },
  props: {
    shelves: {
      type: Array,
      default: () => []
    }
  }
})
