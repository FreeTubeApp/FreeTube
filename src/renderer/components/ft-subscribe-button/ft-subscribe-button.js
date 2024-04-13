import { defineComponent } from 'vue'

import { mapActions } from 'vuex'

import FtButton from '../../components/ft-button/ft-button.vue'
import FtPrompt from '../../components/ft-prompt/ft-prompt.vue'

import { MAIN_PROFILE_ID } from '../../../constants'
import { deepCopy, showToast } from '../../helpers/utils'

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
      required: true
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
      showUnsubscribePopup: false
    }
  },
  computed: {
    profileInitials: function () {
      return this.profileDisplayList.map((profile) => {
        return profile?.name?.length > 0 ? Array.from(profile.name)[0].toUpperCase() : ''
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
          this.showUnsubscribePopup = true
        } else {
          this.handleUnsubscription()
        }
      } else {
        const currentProfile = deepCopy(profile)
        const subscription = {
          id: this.channelId,
          name: this.channelName,
          thumbnail: this.channelThumbnail
        }
        currentProfile.subscriptions.push(subscription)

        this.updateProfile(currentProfile)
        showToast(this.$t('Channel.Added channel to your subscriptions'))

        if (profile._id !== MAIN_PROFILE_ID) {
          const primaryProfile = deepCopy(this.profileList.find(prof => {
            return prof._id === MAIN_PROFILE_ID
          }))

          const index = primaryProfile.subscriptions.findIndex((channel) => {
            return channel.id === this.channelId
          })

          if (index === -1) {
            primaryProfile.subscriptions.push(subscription)
            this.updateProfile(primaryProfile)
          }
        }
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
      this.showUnsubscribePopup = false
      if (value === 'yes') {
        this.handleUnsubscription()
      }
    },

    handleUnsubscription: function (profile = this.activeProfile) {
      const currentProfile = deepCopy(profile)
      currentProfile.subscriptions = currentProfile.subscriptions.filter((channel) => {
        return channel.id !== this.channelId
      })

      this.updateProfile(currentProfile)
      showToast(this.$t('Channel.Channel has been removed from your subscriptions'))

      if (profile._id === MAIN_PROFILE_ID) {
        // Check if a subscription exists in a different profile.
        // Remove from there as well.
        let duplicateSubscriptions = 0

        this.profileList.forEach((profileInList) => {
          if (profileInList._id === MAIN_PROFILE_ID) {
            return
          }
          duplicateSubscriptions += this.unsubscribe(profileInList, this.channelId)
        })

        if (duplicateSubscriptions > 0) {
          const message = this.$t('Channel.Removed subscription from {count} other channel(s)', { count: duplicateSubscriptions })
          showToast(message)
        }
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
      return this.subscriptionInfoForProfile(profile) !== null
    },

    unsubscribe: function(profile, channelId) {
      const parsedProfile = deepCopy(profile)
      const index = parsedProfile.subscriptions.findIndex((channel) => {
        return channel.id === channelId
      })

      if (index !== -1) {
        // use filter instead of splice in case the subscription appears multiple times
        // https://github.com/FreeTubeApp/FreeTube/pull/3468#discussion_r1179290877
        parsedProfile.subscriptions = parsedProfile.subscriptions.filter((x) => {
          return x.id !== channelId
        })

        this.updateProfile(parsedProfile)
        return 1
      }
      return 0
    },

    ...mapActions([
      'updateProfile'
    ])
  }
})
