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
      return this.activeProfile.name.slice(0, 1).toUpperCase()
    },
    profileInitials: function () {
      return this.profileList.map((profile) => {
        return profile.name.slice(0, 1).toUpperCase()
      })
    }
  },
  mounted: function () {
    $('#profileList').focusout(() => {
      $('#profileList')[0].style.display = 'none'
    })
  },
  methods: {
    toggleProfileList: function () {
      $('#profileList')[0].style.display = 'inline'
      $('#profileList').focus()
    },

    openProfileSettings: function () {
      this.$router.push({
        path: '/settings/profile/'
      })
      $('#profileList').focusout()
    },

    setActiveProfile: function (profile) {
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
