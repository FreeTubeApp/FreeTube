import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtListDropdown from '../ft-list-dropdown/ft-list-dropdown.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtShareButton from '../ft-share-button/ft-share-button.vue'
// import { shell } from 'electron'

export default Vue.extend({
  name: 'WatchVideoInfo',
  components: {
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-list-dropdown': FtListDropdown,
    'ft-flex-box': FtFlexBox,
    'ft-icon-button': FtIconButton,
    'ft-share-button': FtShareButton
  },
  props: {
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
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
    published: {
      type: Number,
      required: true
    },
    viewCount: {
      type: Number,
      required: true
    },
    subscriptionCountText: {
      type: String,
      required: true
    },
    likeCount: {
      type: Number,
      default: 0
    },
    dislikeCount: {
      type: Number,
      default: 0
    }
  },
  data: function () {
    return {
      formatTypeLabel: 'VIDEO FORMATS',
      formatTypeValues: [
        'dash',
        'legacy',
        'audio'
      ]
    }
  },
  computed: {
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },

    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },

    profileList: function () {
      return this.$store.getters.getProfileList
    },

    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    formatTypeNames: function () {
      return [
        this.$t('Change Format.Use Dash Formats').toUpperCase(),
        this.$t('Change Format.Use Legacy Formats').toUpperCase(),
        this.$t('Change Format.Use Audio Formats').toUpperCase()
      ]
    },

    totalLikeCount: function () {
      return this.likeCount + this.dislikeCount
    },

    likePercentageRatio: function () {
      return parseInt(this.likeCount / this.totalLikeCount * 100)
    },

    parsedViewCount: function () {
      return this.viewCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ` ${this.$t('Video.Views').toLowerCase()}`
    },

    isSubscribed: function () {
      const subIndex = this.profileList[this.activeProfile].subscriptions.findIndex((channel) => {
        return channel.id === this.channelId
      })

      if (subIndex === -1) {
        return false
      } else {
        return true
      }
    },

    subscribedText: function () {
      if (this.isSubscribed) {
        return `${this.$t('Channel.Unsubscribe').toUpperCase()} ${this.subscriptionCountText}`
      } else {
        return `${this.$t('Channel.Subscribe').toUpperCase()} ${this.subscriptionCountText}`
      }
    },

    dateString() {
      const date = new Date(this.published)
      const dateSplit = date.toDateString().split(' ')
      const localeDateString = `Video.Published.${dateSplit[1]}`
      return `${this.$t(localeDateString)} ${dateSplit[2]}, ${dateSplit[3]}`
    }
  },
  methods: {
    goToChannel: function () {
      this.$router.push({ path: `/channel/${this.channelId}` })
    },

    handleSubscription: function () {
      const currentProfile = JSON.parse(JSON.stringify(this.profileList[this.activeProfile]))
      const primaryProfile = JSON.parse(JSON.stringify(this.profileList[0]))

      if (this.isSubscribed) {
        currentProfile.subscriptions = currentProfile.subscriptions.filter((channel) => {
          return channel.id !== this.channelId
        })

        this.updateProfile(currentProfile)
        this.showToast({
          message: 'Channel has been removed from your subscriptions'
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
            this.showToast({
              message: `Removed subscription from ${duplicateSubscriptions} other channel(s)`
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
          message: 'Added channel to your subscriptions'
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

    handleFormatChange: function (format) {
      switch (format) {
        case 'dash':
          this.$parent.enableDashFormat()
          break
        case 'legacy':
          this.$parent.enableLegacyFormat()
          break
        case 'audio':
          this.$parent.enableAudioFormat()
          break
      }
    },

    ...mapActions([
      'showToast',
      'updateProfile'
    ])
  }
})
