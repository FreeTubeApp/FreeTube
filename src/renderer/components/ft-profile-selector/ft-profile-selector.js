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
      showProfileList: false
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
    $('#profileList').focusout((e) => {
      // do not focus out if the element is a descendant of the profile list
      if ($('#profileList').has(e.relatedTarget).length) {
        return
      }

      $('#profileList')[0].style.display = 'none'
    })
  },
  methods: {
    toggleProfileList: function (event) {
      if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') {
        return
      } else if (event) {
        event.preventDefault()
      }

      let profileList = $('#profileList')
      profileList.get(0).style.display = 'inline'

      let firstProfile = profileList.find('.profile:first')
      firstProfile.attr('tabindex', '0')
      firstProfile.focus()
    },

    openProfileSettings: function () {
      this.$router.push({
        path: '/settings/profile/'
      })
      $('#profileList').focusout()
    },

    setActiveProfile: function (profile, event) {
      if (event instanceof KeyboardEvent) {
        if (event.key === 'Tab') { // navigate to profile settings on tab
          let settings = $('.profileSettings').first()
          settings.attr('tabindex', '0')
          settings.focus()
          return
        } else if (event.key.indexOf('Arrow') != -1) { // arrow navigate to prev/next profile
          event.preventDefault()
          let adjacentSibling = (event.key === 'ArrowUp' || event.key === 'ArrowLeft')
            ? event.target.previousElementSibling
              : event.target.nextElementSibling

          if (adjacentSibling) {
            event.target.setAttribute('tabindex', '-1')
            adjacentSibling.setAttribute('tabindex', '0')
            adjacentSibling.focus()
          }

          return
        } else if (event.key !== 'Enter' && event.key !== ' ') {
          event.preventDefault()
          return
        }
      }

      if (this.profileList[this.activeProfile]._id === profile._id) {
        return
      }
      const index = this.profileList.findIndex((x) => {
        return x._id === profile._id
      })

      if (index === -1) {
        return
      }

      this.updateActiveProfile(index)
      const message = this.$t('Profile.$ is now the active profile').replace('$', profile.name)
      this.showToast({
        message: message
      })
      $('#profileList').focusout()
    },

    ...mapActions([
      'showToast',
      'updateActiveProfile'
    ])
  }
})
