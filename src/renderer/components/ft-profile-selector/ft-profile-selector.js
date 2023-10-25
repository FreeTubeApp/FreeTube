import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtProfileBubble from '../ft-profile-bubble/ft-profile-bubble.vue'
import { deepCopy, showToast, sortListUsingMethod } from '../../helpers/utils'

export default defineComponent({
  name: 'FtProfileSelector',
  components: {
    'ft-card': FtCard,
    'ft-icon-button': FtIconButton,
    'ft-profile-bubble': FtProfileBubble
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
    sortedProfileList: function () {
      const profileList = deepCopy(this.profileList)
      // profiles are already sorted alphabetically ascending
      if (this.profileListOptions.sort !== 'alphabeticalAscending') {
        sortListUsingMethod(profileList, 'name', this.profileListOptions.sort)
      }
      return profileList
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    activeProfileInitial: function () {
      // use Array.from, so that emojis don't get split up into individual character codes
      return this.activeProfile?.name?.length > 0 ? Array.from(this.activeProfile.name)[0].toUpperCase() : ''
    },
    profileInitials: function () {
      return this.profileList.map((profile) => {
        return profile?.name?.length > 0 ? Array.from(profile.name)[0].toUpperCase() : ''
      })
    },
    profileListOptions: function () {
      return this.$store.getters.getProfileListOptions
    },
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
      this.setActiveProfileGivenId(profile._id)
    },

    setActiveProfileGivenId: function (id) {
      if (this.activeProfile._id !== id) {
        const targetProfile = this.profileList.find((x) => {
          return x._id === id
        })

        if (targetProfile) {
          this.updateActiveProfile(targetProfile._id)

          showToast(this.$t('Profile.{profile} is now the active profile', { profile: targetProfile.name }))
        }
      }

      this.profileListShown = false
    },

    ...mapActions([
      'updateActiveProfile'
    ])
  }
})
