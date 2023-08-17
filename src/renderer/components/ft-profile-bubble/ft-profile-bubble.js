import { defineComponent } from 'vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'

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
    sanitizedId: function() {
      return 'profileBubble' + sanitizeForHtmlId(this.profileId)
    },
    profileInitial: function () {
      return this?.profileName?.length > 0 ? Array.from(this.profileName)[0].toUpperCase() : ''
    }
  },
  methods: {
    goToProfile: function (event) {
      if (event instanceof KeyboardEvent) {
        if (event.target.getAttribute('role') === 'link' && event.key !== 'Enter') {
          return
        }
      }
      this.$router.push({
        path: `/settings/profile/edit/${this.profileId}`
      })
    }
  }
})
