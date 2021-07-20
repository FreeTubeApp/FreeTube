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
      return this?.profileName?.length > 0 ? Array.from(this.profileName)[0].toUpperCase() : ''
    }
  },
  methods: {
    goToProfile: function (event) {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Tab') {
          return
        }

        event.preventDefault()

        if (event.target.getAttribute('role') === 'link' && event.key !== 'Enter') {
          return
        } else if (event.key !== 'Enter' && event.key !== ' ') {
          return
        }
      }

      this.$router.push({
        path: `/settings/profile/edit/${this.profileId}`
      })
    }
  }
})
