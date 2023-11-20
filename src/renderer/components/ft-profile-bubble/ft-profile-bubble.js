import { defineComponent } from 'vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'
import { MAIN_PROFILE_ID } from '../../../constants'

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
    isMainProfile: function () {
      return this.profileId === MAIN_PROFILE_ID
    },
    sanitizedId: function() {
      return 'profileBubble' + sanitizeForHtmlId(this.profileId)
    },
    profileInitial: function () {
      return this?.profileName?.length > 0 ? Array.from(this.translatedProfileName)[0].toUpperCase() : ''
    },
    translatedProfileName: function () {
      return this.isMainProfile ? this.$t('Profile.All Channels') : this.profileName
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
