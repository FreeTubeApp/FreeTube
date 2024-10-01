import { defineComponent } from 'vue'
import { sanitizeForHtmlId } from '../../helpers/accessibility'
import { MAIN_PROFILE_ID } from '../../../constants'
import { getFirstCharacter } from '../../helpers/strings'

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
  emits: ['click'],
  computed: {
    locale: function () {
      return this.$i18n.locale
    },
    isMainProfile: function () {
      return this.profileId === MAIN_PROFILE_ID
    },
    sanitizedId: function() {
      return 'profileBubble' + sanitizeForHtmlId(this.profileId)
    },
    profileInitial: function () {
      return this.profileName
        ? getFirstCharacter(this.translatedProfileName, this.locale).toUpperCase()
        : ''
    },
    translatedProfileName: function () {
      return this.isMainProfile ? this.$t('Profile.All Channels') : this.profileName
    }
  },
  methods: {
    click: function() {
      this.$emit('click')
    },
  }
})
