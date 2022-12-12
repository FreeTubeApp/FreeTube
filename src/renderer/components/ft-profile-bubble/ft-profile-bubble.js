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
    },
    profileImageUrl: {
      type: String,
      default: '',
      required: false
    }
  },
  computed: {
    profileInitial: function () {
      return this?.profileName?.length > 0 ? Array.from(this.profileName)[0].toUpperCase() : ''
    },
    hasProfileImage: function () {
      // the profile image url should both exist and be a non-empty string
      return this?.profileImageUrl && !this.profileImageUrl?.length > 0
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
