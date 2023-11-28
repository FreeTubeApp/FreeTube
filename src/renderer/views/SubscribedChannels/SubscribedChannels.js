import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSubscribeButton from '../../components/ft-subscribe-button/ft-subscribe-button.vue'
import { invidiousGetChannelInfo, youtubeImageUrlToInvidious, invidiousImageUrlToInvidious, invidiousImageUrlToYoutube } from '../../helpers/api/invidious'
import { getLocalChannel } from '../../helpers/api/local'
import { MiscConstants } from '../../../constants'

export default defineComponent({
  name: 'SubscribedChannels',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput,
    'ft-subscribe-button': FtSubscribeButton
  },
  data: function () {
    return {
      query: '',
      re: {
        url: /(.+=\w)\d+(.+)/,
      },
      thumbnailSize: 176,
      subscribedChannels: [],
      filteredChannels: [],
      errorCount: 0,
      updatingChannels: new Set()
    }
  },
  computed: {
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },

    activeProfileId: function () {
      return this.activeProfile._id
    },

    activeSubscriptionList: function () {
      return this.activeProfile.subscriptions
    },

    channelList: function () {
      if (this.query !== '') {
        return this.filteredChannels
      } else {
        return this.subscribedChannels
      }
    },

    hideUnsubscribeButton: function() {
      return this.$store.getters.getHideUnsubscribeButton
    },

    locale: function () {
      return this.$i18n.locale.replace('_', '-')
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    hideActiveSubscriptions: function () {
      return this.$store.getters.getHideActiveSubscriptions
    },
  },
  watch: {
    activeProfileId: function() {
      this.query = ''
      this.getSubscription()
    },

    activeSubscriptionList: function() {
      this.getSubscription()
      this.filterChannels()
    }
  },
  created: function () {
    this.CHANNEL_IMAGE_BROKEN = MiscConstants.CHANNEL_IMAGE_BROKEN
    this.CHANNEL_IMAGE_NOT_EXISTENT = MiscConstants.CHANNEL_IMAGE_NOT_EXISTENT
  },
  mounted: function () {
    this.getSubscription()
    this.subscribedChannels.forEach(channel => {
      if (channel.thumbnail === null) {
        this.updateThumbnail(channel)
      }
    })
  },
  methods: {
    getSubscription: function () {
      this.subscribedChannels = this.activeSubscriptionList.slice().sort((a, b) => {
        return a.name?.toLowerCase().localeCompare(b.name?.toLowerCase(), this.locale)
      })
    },

    handleInput: function(input) {
      this.query = input
      this.filterChannels()
    },

    filterChannels: function () {
      if (this.query === '') {
        this.filteredChannels = []
        return
      }

      const escapedQuery = this.query.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&')
      const re = new RegExp(escapedQuery, 'i')
      this.filteredChannels = this.subscribedChannels.filter(channel => {
        return re.test(channel.name)
      })
    },

    thumbnailURL: function(originalURL) {
      if (originalURL == null) { return null }

      let newURL = originalURL
      if (newURL) {
        // Sometimes relative protocol URLs are passed in
        if (newURL.startsWith('//')) {
          newURL = `https:${newURL}`
        }
        const hostname = new URL(newURL).hostname
        if (process.env.IS_ELECTRON && this.backendPreference === 'invidious') {
          if (hostname === 'yt3.ggpht.com' || hostname === 'yt3.googleusercontent.com') {
            newURL = youtubeImageUrlToInvidious(newURL, this.currentInvidiousInstance)
          } else {
            newURL = invidiousImageUrlToInvidious(newURL, this.currentInvidiousInstance)
          }
        } else {
          if (hostname !== 'yt3.ggpht.com' && hostname !== 'yt3.googleusercontent.com') {
            newURL = invidiousImageUrlToYoutube(newURL)
          }
        }
      }

      return newURL.replace(this.re.url, `$1${this.thumbnailSize}$2`)
    },

    updateThumbnail: function(channel) {
      if (this.hideActiveSubscriptions) {
        if (!this.updatingChannels.has(channel.id)) {
          this.updatingChannels.add(channel.id)
          this.errorCount += 1
          if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
            // avoid too many concurrent requests
            setTimeout(() => {
              const existChannel = this.activeSubscriptions.find(e => e.id === channel.id)
              // check again in-case someone unsubscribed
              if (existChannel && existChannel.thumbnail === null) {
                invidiousGetChannelInfo(channel.id).then(response => {
                  this.updateSubscriptionDetails({
                    channelThumbnailUrl: response.authorThumbnails[0].url,
                    channelName: channel.name,
                    channelId: channel.id
                  })
                }).catch(e => {
                  this.updateSubscriptionDetails({
                    channelThumbnailUrl: MiscConstants.CHANNEL_IMAGE_BROKEN,
                    channelName: channel.name,
                    channelId: channel.id
                  })
                })
              }
            }, this.errorCount * 500)
          } else {
            setTimeout(() => {
              const existChannel = this.activeSubscriptions.find(e => e.id === channel.id)
              // check again in-case someone unsubscribed
              if (existChannel && existChannel.thumbnail === null) {
                getLocalChannel(channel.id).then(response => {
                  if (!response.alert) {
                    this.updateSubscriptionDetails({
                      channelThumbnailUrl: response.header.author.thumbnails[0].url,
                      channelName: channel.name,
                      channelId: channel.id
                    })
                  } else {
                    this.updateSubscriptionDetails({
                      channelThumbnailUrl: MiscConstants.CHANNEL_IMAGE_BROKEN,
                      channelName: channel.name,
                      channelId: channel.id
                    })
                  }
                })
              }
            }, this.errorCount * 500)
          }
        }
      }
    },

    ...mapActions([
      'updateSubscriptionDetails'
    ])
  }
})
