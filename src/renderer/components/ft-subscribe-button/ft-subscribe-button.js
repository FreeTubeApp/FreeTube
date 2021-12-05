import Vue from 'vue'
import { mapActions } from 'vuex'

import FtButton from '../../components/ft-button/ft-button.vue'

export default Vue.extend({
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
    isSubscribed: {
      type: Boolean,
      required: true
    },
    subscribedText: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      showProfiles: false
    }
  },
  computed: {
    profileList: function () {
      return this.$store.getters.getProfileList
    },

    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    profileInitials: function () {
      return this.profileList.map((profile) => {
        return profile?.name?.length > 0 ? Array.from(profile.name)[0].toUpperCase() : ''
      })
    }
  },
  methods: {
    subscribe: function (profile) {
      const profileIndex = this.profileList.findIndex((profileInList) => {
        return profileInList.name === profile.name
      })
      const targetProfile = JSON.parse(JSON.stringify(this.profileList[profileIndex]))
      const channelIndex = targetProfile.subscriptions.findIndex((channel) => {
        return channel.id === this.channelId
      })

      if (channelIndex !== -1) {
        this.showToast({
          message: this.$t('Channel.Channel already added to your subscriptions')
        })
      } else {
        const primaryProfile = JSON.parse(JSON.stringify(this.profileList[0]))
        const subscription = {
          id: this.channelId,
          name: this.channelName,
          thumbnail: this.channelThumbnail
        }

        targetProfile.subscriptions.push(subscription)
        this.updateProfile(targetProfile)
        this.showToast({
          message: this.$t('Channel.Added channel to your subscriptions')
        })
        this.showProfiles = false

        const primaryProfileIndex = primaryProfile.subscriptions.findIndex((channel) => {
          return channel.id === this.channelId
        })

        if (primaryProfileIndex === -1) {
          primaryProfile.subscriptions.push(subscription)
          this.updateProfile(primaryProfile)
        }
      }
    },

    handleSubscription: function () {
      if (this.channelId === '') {
        return
      }

      const currentProfile = JSON.parse(JSON.stringify(this.profileList[this.activeProfile]))
      const primaryProfile = JSON.parse(JSON.stringify(this.profileList[0]))

      if (this.isSubscribed) {
        currentProfile.subscriptions = currentProfile.subscriptions.filter((channel) => {
          return channel.id !== this.channelId
        })

        this.updateProfile(currentProfile)
        this.showToast({
          message: this.$t('Channel.Channel has been removed from your subscriptions')
        })

        if (this.activeProfile === 0) {
          // Check if a subscription exists in a different profile.
          // Remove from there as well.
          let duplicateSubscriptions = 0

          this.profileList.forEach((profile) => {
            if (profile._id === 'allChannels') {
              return
            }
            const parsedProfile = JSON.parse(JSON.stringify(profile))
            const index = parsedProfile.subscriptions.findIndex((channel) => {
              return channel.id === this.channelId
            })

            if (index !== -1) {
              duplicateSubscriptions++

              parsedProfile.subscriptions = parsedProfile.subscriptions.filter((x) => {
                return x.id !== this.channelId
              })

              this.updateProfile(parsedProfile)
            }
          })

          if (duplicateSubscriptions > 0) {
            const message = this.$t('Channel.Removed subscription from $ other channel(s)')
            this.showToast({
              message: message.replace('$', duplicateSubscriptions)
            })
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
        this.showToast({
          message: this.$t('Channel.Added channel to your subscriptions')
        })

        if (this.activeProfile !== 0) {
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

    showProfileList: function () {
      this.showProfiles = !this.showProfiles
    },

    ...mapActions([
      'showToast',
      'updateProfile'
    ])
  }
})
