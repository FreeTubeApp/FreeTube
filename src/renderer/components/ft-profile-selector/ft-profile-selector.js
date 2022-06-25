import Vue from 'vue'
import { mapActions } from 'vuex'
import $ from 'jquery'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'

export default Vue.extend({
  name: 'FtProfileSelector',
  components: {
    'ft-card': FtCard,
    'ft-icon-button': FtIconButton
  },
  data: function () {
    return {
      profileListShown: false
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
      return this?.activeProfile?.name?.length > 0 ? Array.from(this.activeProfile.name)[0].toUpperCase() : ''
    },
    profileInitials: function () {
      return this.profileList.map((profile) => {
        return profile?.name?.length > 0 ? Array.from(profile.name)[0].toUpperCase() : ''
      })
    }
  },
  mounted: function () {
    $('#profileList').on('focusout', (e) => {
      // do not focus out if the element is a descendant of the profile list
      if ($('#profileList').has(e.relatedTarget).length) {
        return
      }

      $('#profileList')[0].style.display = 'none'
      // When pressing the profile button
      // It will make the menu reappear if we set `profileListShown` immediately
      setTimeout(() => {
        this.profileListShown = false
      }, 100)
    })
  },
  methods: {
    toggleProfileList: function () {
      const profileList = $('#profileList')
      if (this.profileListShown) {
        profileList[0].style.display = 'none'
        this.profileListShown = false
        return
      }

      profileList[0].style.display = 'inline'
      this.profileListShown = true

      const openProfile = $(`#profile-${this.activeProfile.name}`)
      openProfile.attr('tabindex', '0')
      openProfile.attr('aria-selected', 'true')
      openProfile[0]?.focus()
    },

    openProfileSettings: function () {
      this.$router.push({
        path: '/settings/profile/'
      })
      $('#profileList').trigger('focusout')
    },

    setActiveProfile: function (profile, event) {
      const openProfileSettingsButton = document.getElementById('profileSettings')
      if (!this.$handleDropdownKeyboardEvent(event, event?.currentTarget, openProfileSettingsButton)) {
        return
      }

      const activeProfile = document.getElementById(`profile-${this.activeProfile.name}`)
      activeProfile?.setAttribute('aria-selected', 'false')

      if (this.activeProfile._id !== profile._id) {
        const targetProfile = this.profileList.find((x) => {
          return x._id === profile._id
        })

        if (targetProfile) {
          this.updateActiveProfile(targetProfile._id)
          const message = this.$t('Profile.$ is now the active profile').replace('$', profile.name)
          this.showToast({ message })
        }
      }

      $('#profileList').trigger('focusout')
    },

    ...mapActions([
      'showToast',
      'updateActiveProfile'
    ])
  }
})
