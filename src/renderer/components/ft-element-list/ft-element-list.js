import Vue from 'vue'
import FtAutoGrid from '../ft-auto-grid/ft-auto-grid.vue'
import FtListLazyWrapper from '../ft-list-lazy-wrapper/ft-list-lazy-wrapper.vue'

export default Vue.extend({
  name: 'FtElementList',
  components: {
    'ft-auto-grid': FtAutoGrid,
    'ft-list-lazy-wrapper': FtListLazyWrapper
  },
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    }
  }
})
