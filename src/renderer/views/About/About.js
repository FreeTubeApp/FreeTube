import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

const { version } = require('../../../../package.json')

export default Vue.extend({
  name: 'About',
  components: {
    'ft-card': FtCard,
    'ft-element-list': FtElementList
  },
  data: function () {
    return {
      versionNumber: `v${version}`
    }
  },
  mounted: function () {
  }
})
