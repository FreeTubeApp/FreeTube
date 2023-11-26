import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSubscribeButton from '../../components/ft-subscribe-button/ft-subscribe-button.vue'
import { invidiousGetChannelInfo, youtubeImageUrlToInvidious, invidiousImageUrlToInvidious, invidiousImageUrlToYoutube } from '../../helpers/api/invidious'
import { getLocalChannel } from '../../helpers/api/local'

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
      errorCount: 0
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
    }
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
  mounted: function () {
    this.getSubscription()
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
      this.errorCount += 1
      if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
        // avoid too many concurrent requests
        setTimeout(() => {
          invidiousGetChannelInfo(channel.id).then(response => {
            this.updateSubscriptionDetails({
              channelThumbnailUrl: response.authorThumbnails[0].url,
              channelName: channel.name,
              channelId: channel.id
            })
          }).catch(e => {
            this.updateSubscriptionDetails({
              channelThumbnailUrl: '_',
              channelName: channel.name,
              channelId: channel.id
            })
          })
        }, this.errorCount * 500)
      } else {
        setTimeout(() => {
          getLocalChannel(channel.id).then(response => {
            if (!response.alert) {
              this.updateSubscriptionDetails({
                channelThumbnailUrl: response.header.author.thumbnails[0].url,
                channelName: channel.name,
                channelId: channel.id
              })
            } else {
              this.updateSubscriptionDetails({
                channelThumbnailUrl: '_',
                channelName: channel.name,
                channelId: channel.id
              })
            }
          })
        }, this.errorCount * 500)
      }
    },

    ...mapActions([
      'updateSubscriptionDetails'
    ])
  }
})
