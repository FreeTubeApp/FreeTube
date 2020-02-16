import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

export default Vue.extend({
  name: 'History',
  components: {
    'ft-card': FtCard,
    'ft-element-list': FtElementList
  },
  mounted: function () {
  }
})
