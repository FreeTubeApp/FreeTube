import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSubscribeButton from '../../components/ft-subscribe-button/ft-subscribe-button.vue'
import { invidiousGetChannelInfo, youtubeImageUrlToInvidious, invidiousImageUrlToInvidious } from '../../helpers/api/invidious'
import { getLocalChannel } from '../../helpers/api/local'
import { ctrlFHandler } from '../../helpers/utils'

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
      subscribedChannels: [],
      filteredChannels: [],
      re: {
        url: /(.+=\w)\d+(.+)/,
        ivToYt: /^.+ggpht\/(.+)/
      },
      thumbnailSize: 176,
      ytBaseURL: 'https://yt3.ggpht.com',
      errorCount: 0,
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

    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
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
    document.addEventListener('keydown', this.keyboardShortcutHandler)
    this.getSubscription()
  },
  beforeDestroy: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
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
      let newURL = originalURL
      // Sometimes relative protocol URLs are passed in
      if (originalURL.startsWith('//')) {
        newURL = `https:${originalURL}`
      }
      const hostname = new URL(newURL).hostname
      if (hostname === 'yt3.ggpht.com' || hostname === 'yt3.googleusercontent.com') {
        if (this.backendPreference === 'invidious') { // YT to IV
          newURL = youtubeImageUrlToInvidious(newURL, this.currentInvidiousInstanceUrl)
        }
      } else {
        if (this.backendPreference === 'local') { // IV to YT
          newURL = newURL.replace(this.re.ivToYt, `${this.ytBaseURL}/$1`)
        } else { // IV to IV
          newURL = invidiousImageUrlToInvidious(newURL, this.currentInvidiousInstanceUrl)
        }
      }

      return newURL.replace(this.re.url, `$1${this.thumbnailSize}$2`)
    },

    updateThumbnail: function(channel) {
      this.errorCount += 1
      if (this.backendPreference === 'local') {
        // avoid too many concurrent requests
        setTimeout(() => {
          getLocalChannel(channel.id).then(response => {
            if (!response.alert) {
              this.updateSubscriptionDetails({
                channelThumbnailUrl: this.thumbnailURL(response.header.author.thumbnails[0].url),
                channelName: channel.name,
                channelId: channel.id
              })
            }
          })
        }, this.errorCount * 500)
      } else {
        setTimeout(() => {
          invidiousGetChannelInfo(channel.id).then(response => {
            this.updateSubscriptionDetails({
              channelThumbnailUrl: this.thumbnailURL(response.authorThumbnails[0].url),
              channelName: channel.name,
              channelId: channel.id
            })
          })
        }, this.errorCount * 500)
      }
    },

    keyboardShortcutHandler: function (event) {
      ctrlFHandler(event, this.$refs.searchBarChannels)
    },

    ...mapActions([
      'updateSubscriptionDetails'
    ])
  }
})
