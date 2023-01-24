import { defineComponent } from 'vue'

export default defineComponent({
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
    goToProfile: function () {
      this.$router.push({
        path: `/settings/profile/edit/${this.profileId}`
      })
    }
  }
})
