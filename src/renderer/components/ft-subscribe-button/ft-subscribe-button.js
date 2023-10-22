import { defineComponent } from 'vue'

import { mapActions } from 'vuex'

import FtButton from '../../components/ft-button/ft-button.vue'

import { MAIN_PROFILE_ID } from '../../../constants'
import { deepCopy, showToast } from '../../helpers/utils'

export default defineComponent({
  name: 'FtSubscribeButton',
  components: {
    'ft-button': FtButton
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
    subscriptionCountText: {
      default: '',
      type: String,
      required: false
    }
  },
  data: function () {
    return {
      isProfileDropdownOpen: false
    }
  },
  computed: {
    profileList: function () {
      return this.$store.getters.getProfileList
    },

    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    subscriptionInfo: function () {
      return this.activeProfile.subscriptions.find((channel) => {
        return channel.id === this.channelId
      }) ?? null
    },

    isSubscribed: function () {
      return this.subscriptionInfo !== null
    },

    hideChannelSubscriptions: function () {
      return this.$store.getters.getHideChannelSubscriptions
    },

    subscribedText: function () {
      let subscribedValue = (this.isSubscribed ? this.$t('Channel.Unsubscribe') : this.$t('Channel.Subscribe')).toUpperCase()
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
    handleSubscription: function () {
      if (this.channelId === '') {
        return
      }

      const currentProfile = deepCopy(this.activeProfile)

      if (this.isSubscribed) {
        currentProfile.subscriptions = currentProfile.subscriptions.filter((channel) => {
          return channel.id !== this.channelId
        })

        this.updateProfile(currentProfile)
        showToast(this.$t('Channel.Channel has been removed from your subscriptions'))

        if (this.activeProfile._id === MAIN_PROFILE_ID) {
          // Check if a subscription exists in a different profile.
          // Remove from there as well.
          let duplicateSubscriptions = 0

          this.profileList.forEach((profile) => {
            if (profile._id === MAIN_PROFILE_ID) {
              return
            }
            duplicateSubscriptions += this.unsubscribe(profile, this.channelId)
          })

          if (duplicateSubscriptions > 0) {
            const message = this.$t('Channel.Removed subscription from {count} other channel(s)', { count: duplicateSubscriptions })
            showToast(message)
          }
        }
      } else {
        const subscription = {
          id: this.channelId,
          name: this.channelName,
          thumbnail: this.channelThumbnail
        }
        currentProfile.subscriptions.push(subscription)

        this.updateProfile(currentProfile)
        showToast(this.$t('Channel.Added channel to your subscriptions'))

        if (this.activeProfile._id !== MAIN_PROFILE_ID) {
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
    },

    toggleProfileDropdown: function() {
      this.isProfileDropdownOpen = !this.isProfileDropdownOpen
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
