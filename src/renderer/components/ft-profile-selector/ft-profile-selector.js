import { defineComponent, nextTick } from 'vue'
import { mapActions } from 'vuex'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import { showToast } from '../../helpers/utils'
import { MAIN_PROFILE_ID } from '../../../constants'
import { getFirstCharacter } from '../../helpers/strings'

export default defineComponent({
  name: 'FtProfileSelector',
  components: {
    'ft-card': FtCard,
    'ft-icon-button': FtIconButton
  },
  data: function () {
    return {
      profileListShown: false,
      mouseDownOnIcon: false
    }
  },
  computed: {
    locale: function () {
      return this.$i18n.locale
    },
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    activeProfileInitial: function () {
      return this.activeProfile?.name
        ? getFirstCharacter(this.translatedProfileName(this.activeProfile), this.locale).toUpperCase()
        : ''
    },
    profileInitials: function () {
      return this.profileList.map((profile) => {
        return profile?.name
          ? getFirstCharacter(this.translatedProfileName(profile), this.locale).toUpperCase()
          : ''
      })
    }
  },
  methods: {
    isActiveProfile: function (profile) {
      return profile._id === this.activeProfile._id
    },

    toggleProfileList: function () {
      this.profileListShown = !this.profileListShown

      if (this.profileListShown) {
        // wait until the profile list is visible
        // then focus it so we can hide it automatically when it loses focus
        nextTick(() => {
          this.$refs.profileList?.$el?.focus()
        })
      }
    },

    openProfileSettings: function () {
      this.$router.push({
        path: '/settings/profile/'
      })
      this.profileListShown = false
    },

    handleIconMouseDown: function () {
      if (this.profileListShown) {
        this.mouseDownOnIcon = true
      }
    },

    handleProfileListFocusOut: function () {
      if (this.mouseDownOnIcon) {
        this.mouseDownOnIcon = false
      } else if (!this.$refs.profileList.$el.matches(':focus-within')) {
        this.profileListShown = false
      }
    },

    handleProfileListEscape: function () {
      this.$refs.iconButton.focus()
      // handleProfileListFocusOut will hide the dropdown for us
    },

    setActiveProfile: function (profile) {
      if (this.activeProfile._id !== profile._id) {
        const targetProfile = this.profileList.find((x) => {
          return x._id === profile._id
        })

        if (targetProfile) {
          this.updateActiveProfile(targetProfile._id)

          showToast(this.$t('Profile.{profile} is now the active profile', { profile: this.translatedProfileName(profile) }))
        }
      }

      this.profileListShown = false
    },

    translatedProfileName: function (profile) {
      return profile._id === MAIN_PROFILE_ID ? this.$t('Profile.All Channels') : profile.name
    },

    ...mapActions([
      'updateActiveProfile'
    ])
  }
})
