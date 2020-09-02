import Vue from 'vue'

export default Vue.extend({
  name: 'FtProfileBubble',
  props: {
    profileName: {
      type: String,
      required: true
    },
    profileId: {
      type: String,
      required: true
    },
    backgroundColor: {
      type: String,
      required: true
    },
    textColor: {
      type: String,
      required: true
    }
  },
  computed: {
    profileInitial: function () {
      return this.profileName.slice(0, 1).toUpperCase()
    }
  },
  methods: {
    goToProfile: function () {
      this.$router.push({
        path: `/settings/profile/edit/${this.profileId}`
      })
    }
  }
})
