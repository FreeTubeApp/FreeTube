import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtButton from '../../components/ft-button/ft-button.vue'

const { version } = require('../../../../package.json')

export default Vue.extend({
  name: 'About',
  components: {
    'ft-card': FtCard,
    'ft-element-list': FtElementList,
    'ft-button': FtButton
  },
  data: function () {
    return {
      versionNumber: `v${version}`
    }
  },
  computed: {
    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    }
  },
  methods: {
    openUrl: function (url) {
      if (this.usingElectron) {
        const shell = require('electron').shell
        shell.openExternal(url)
      }
    }
  }
})
