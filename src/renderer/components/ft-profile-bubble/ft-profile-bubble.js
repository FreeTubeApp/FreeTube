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
      if (this.profileName !== undefined) {
        if (this.profileName.length > 0) {
          return Array.from(this.profileName)[0].toUpperCase()
        }
      }
      return ''
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
