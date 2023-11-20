import { defineComponent } from 'vue'
import { mapActions } from 'vuex'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import { showToast } from '../../helpers/utils'
import { MAIN_PROFILE_ID } from '../../../constants'

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
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    activeProfileInitial: function () {
      // use Array.from, so that emojis don't get split up into individual character codes
      return this.activeProfile?.name?.length > 0 ? Array.from(this.translatedProfileName(this.activeProfile))[0].toUpperCase() : ''
    },
    profileInitials: function () {
      return this.profileList.map((profile) => {
        return profile?.name?.length > 0 ? Array.from(this.translatedProfileName(profile))[0].toUpperCase() : ''
      })
    }
  },
  methods: {
    toggleProfileList: function () {
      this.profileListShown = !this.profileListShown

      if (this.profileListShown) {
        // wait until the profile list is visible
        // then focus it so we can hide it automatically when it loses focus
        setTimeout(() => {
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
