import Vue from 'vue'
import { mapActions } from 'vuex'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import { showToast } from '../../helpers/utils'

export default Vue.extend({
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
    defaultProfile: function () {
      return this.$store.getters.getDefaultProfile
    },
    activeProfileInitial: function () {
      return this.activeProfile?.name?.length > 0 ? this.activeProfile.name[0].toUpperCase() : ''
    },
    profileInitials: function () {
      return this.profileList.map((profile) => {
        return profile?.name?.length > 0 ? profile.name[0].toUpperCase() : ''
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
          this.$refs.profileList.$el.focus()
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

          showToast(this.$t('Profile.{profile} is now the active profile', { profile: profile.name }))
        }
      }

      this.profileListShown = false
    },

    ...mapActions([
      'updateActiveProfile'
    ])
  }
})
