import Vue from 'vue'
import router from '../../router/index.js'

export default Vue.extend({
  name: 'SideNav',
  computed: {
    isOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    }
  },
  methods: {
    navigate: function (route) {
      router.push('/' + route)
    }
  }
})
