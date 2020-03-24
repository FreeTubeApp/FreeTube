import Vue from 'vue'

export default Vue.extend({
  name: 'SideNav',
  data: function () {
    return {
      openMoreOptions: false
    }
  },
  methods: {
    navigate: function (route) {
      this.openMoreOptions = false
      this.$emit('navigate', route)
    }
  }
})
