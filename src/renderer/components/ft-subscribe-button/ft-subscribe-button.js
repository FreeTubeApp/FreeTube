import { defineComponent } from 'vue'

import { mapActions } from 'vuex'

import FtButton from '../../components/ft-button/ft-button.vue'
import FtPrompt from '../../components/ft-prompt/ft-prompt.vue'

import { MAIN_PROFILE_ID } from '../../../constants'
import { showToast } from '../../helpers/utils'
import { getFirstCharacter } from '../../helpers/strings'

export default defineComponent({
  name: 'FtSubscribeButton',
  components: {
    'ft-button': FtButton,
    'ft-prompt': FtPrompt
  },
  props: {
    channelId: {
      type: String,
      required: true
    },
    channelName: {
      type: String,
      required: true
    },
    channelThumbnail: {
      type: String,
      default: null
    },
    hideProfileDropdownToggle: {
      type: Boolean,
      default: false
    },
    openDropdownOnSubscribe: {
      type: Boolean,
      default: true
    },
    subscriptionCountText: {
      default: '',
      type: String,
      required: false
    }
  },
  data: function () {
    return {
      isProfileDropdownOpen: false,
      showUnsubscribePopupForProfile: null
    }
  },
  computed: {
    locale: function () {
      return this.$i18n.locale.replace('_', '-')
    },
    profileInitials: function () {
      return this.profileDisplayList.map((profile) => {
        return profile.name
          ? getFirstCharacter(profile.name, this.locale).toUpperCase()
          : ''
      })
    },

    profileList: function () {
      return this.$store.getters.getProfileList
    },

    /* sort by 'All Channels' -> active profile -> unsubscribed channels -> subscribed channels */
    profileDisplayList: function () {
      const mainProfileAndActiveProfile = [this.profileList[0]]
      if (this.activeProfile._id !== MAIN_PROFILE_ID) {
        mainProfileAndActiveProfile.push(this.activeProfile)
      }

      return [
        ...mainProfileAndActiveProfile,
        ...this.profileList.filter((profile, i) =>
          i !== 0 && !this.isActiveProfile(profile) && !this.isProfileSubscribed(profile)),
        ...this.profileList.filter((profile, i) =>
          i !== 0 && !this.isActiveProfile(profile) && this.isProfileSubscribed(profile))
      ]
    },

    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    subscriptionInfo: function () {
      return this.subscriptionInfoForProfile(this.activeProfile)
    },

    hideChannelSubscriptions: function () {
      return this.$store.getters.getHideChannelSubscriptions
    },

    subscribedText: function () {
      let subscribedValue = (this.isProfileSubscribed(this.activeProfile) ? this.$t('Channel.Unsubscribe') : this.$t('Channel.Subscribe')).toUpperCase()
      if (this.subscriptionCountText !== '' && !this.hideChannelSubscriptions) {
        subscribedValue += ' ' + this.subscriptionCountText
      }
      return subscribedValue
    },

    isProfileDropdownEnabled: function () {
      return !this.hideProfileDropdownToggle && this.profileList.length > 1
    }

  },
  methods: {
    handleSubscription: function (profile = this.activeProfile) {
      if (this.channelId === '') {
        return
      }

      if (this.isProfileSubscribed(profile)) {
        if (this.$store.getters.getUnsubscriptionPopupStatus) {
          this.showUnsubscribePopupForProfile = profile
        } else {
          this.handleUnsubscription(profile)
        }
      } else {
        const profileIds = [profile._id]

        if (profile._id !== MAIN_PROFILE_ID) {
          const primaryProfile = this.profileList.find(prof => {
            return prof._id === MAIN_PROFILE_ID
          })

          if (!this.isProfileSubscribed(primaryProfile)) {
            profileIds.push(MAIN_PROFILE_ID)
          }
        }

        const channel = {
          id: this.channelId,
          name: this.channelName,
          thumbnail: this.channelThumbnail
        }

        this.addChannelToProfiles({ channel, profileIds })

        showToast(this.$t('Channel.Added channel to your subscriptions'))
      }

      if (this.isProfileDropdownEnabled && this.openDropdownOnSubscribe && !this.isProfileDropdownOpen) {
        this.toggleProfileDropdown()
      }
    },

    handleProfileDropdownFocusOut: function () {
      if (!this.$refs.subscribeButton.matches(':focus-within')) {
        this.isProfileDropdownOpen = false
      }
    },

    toggleProfileDropdown: function () {
      this.isProfileDropdownOpen = !this.isProfileDropdownOpen
    },

    handleUnsubscribeConfirmation: async function (value) {
      const profile = this.showUnsubscribePopupForProfile
      this.showUnsubscribePopupForProfile = null
      if (value === 'yes') {
        this.handleUnsubscription(profile)
      }
    },

    handleUnsubscription: function (profile) {
      const profileIds = [profile._id]

      if (profile._id === MAIN_PROFILE_ID) {
        // Check if a subscription exists in a different profile.
        // Remove from there as well.

        this.profileList.forEach((profileInList) => {
          if (profileInList._id === MAIN_PROFILE_ID) {
            return
          }

          if (this.isProfileSubscribed(profileInList)) {
            profileIds.push(profileInList._id)
          }
        })
      }

      this.removeChannelFromProfiles({
        channelId: this.channelId,
        profileIds
      })

      showToast(this.$t('Channel.Channel has been removed from your subscriptions'))

      if (profile._id === MAIN_PROFILE_ID && profileIds.length > 1) {
        showToast(this.$t('Channel.Removed subscription from {count} other channel(s)', {
          count: profileIds.length - 1
        }))
      }
    },

    isActiveProfile: function (profile) {
      return profile._id === this.activeProfile._id
    },

    subscriptionInfoForProfile: function (profile) {
      return profile.subscriptions.find((channel) => {
        return channel.id === this.channelId
      }) ?? null
    },

    isProfileSubscribed: function (profile) {
      return profile.subscriptions.some((channel) => {
        return channel.id === this.channelId
      })
    },

    ...mapActions([
      'addChannelToProfiles',
      'removeChannelFromProfiles'
    ])
  }
})
