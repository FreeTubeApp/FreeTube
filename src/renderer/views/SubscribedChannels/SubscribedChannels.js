import Vue from 'vue'
import { mapActions } from 'vuex'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtPrompt from '../../components/ft-prompt/ft-prompt.vue'
import ytch from 'yt-channel-info'

export default Vue.extend({
  name: 'SubscribedChannels',
  components: {
    'ft-button': FtButton,
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput,
    'ft-prompt': FtPrompt
  },
  data: function () {
    return {
      query: '',
      subscribedChannels: [],
      filteredChannels: [],
      re: {
        url: /(.+=\w{1})\d+(.+)/,
        ivToIv: /^.+(ggpht.+)/,
        ivToYt: /^.+ggpht\/(.+)/,
        ytToIv: /^.+ggpht\.com\/(.+)/
      },
      thumbnailSize: 176,
      ytBaseURL: 'https://yt3.ggpht.com',
      showUnsubscribePrompt: false,
      unsubscribePromptValues: [
        'yes',
        'no'
      ],
      channelToUnsubscribe: null,
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

    locale: function () {
      return this.$store.getters.getCurrentLocale.replace('_', '-')
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },

    unsubscribePromptNames: function () {
      return [
        this.$t('Yes'),
        this.$t('No')
      ]
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
        return a.name.localeCompare(b.name, this.locale)
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

      const escapedQuery = this.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(escapedQuery, 'i')
      this.filteredChannels = this.subscribedChannels.filter(channel => {
        return re.test(channel.name)
      })
    },

    handleUnsubscribeButtonClick: function(channel) {
      this.channelToUnsubscribe = channel
      this.showUnsubscribePrompt = true
    },

    handleUnsubscribePromptClick: function(value) {
      this.showUnsubscribePrompt = false
      if (value !== 'yes') {
        this.channelToUnsubscribe = null
        return
      }
      this.unsubscribeChannel()
    },

    unsubscribeChannel: function () {
      const currentProfile = JSON.parse(JSON.stringify(this.activeProfile))
      let index = currentProfile.subscriptions.findIndex(channel => {
        return channel.id === this.channelToUnsubscribe.id
      })
      currentProfile.subscriptions.splice(index, 1)

      this.updateProfile(currentProfile)
      this.showToast({
        message: this.$t('Channels.Unsubscribed').replace('$', this.channelToUnsubscribe.name)
      })

      index = this.subscribedChannels.findIndex(channel => {
        return channel.id === this.channelToUnsubscribe.id
      })
      this.subscribedChannels.splice(index, 1)

      index = this.filteredChannels.findIndex(channel => {
        return channel.id === this.channelToUnsubscribe.id
      })
      if (index !== -1) {
        this.filteredChannels.splice(index, 1)
      }

      this.channelToUnsubscribe = null
    },

    thumbnailURL: function(originalURL) {
      let newURL = originalURL
      if (originalURL.indexOf('ggpht.com') > -1) {
        if (this.backendPreference === 'invidious') { // YT to IV
          newURL = originalURL.replace(this.re.ytToIv, `${this.currentInvidiousInstance}/ggpht/$1`)
        }
      } else {
        if (this.backendPreference === 'local') { // IV to YT
          newURL = originalURL.replace(this.re.ivToYt, `${this.ytBaseURL}/$1`)
        } else { // IV to IV
          newURL = originalURL.replace(this.re.ivToIv, `${this.currentInvidiousInstance}/$1`)
        }
      }

      return newURL.replace(this.re.url, `$1${this.thumbnailSize}$2`)
    },

    updateThumbnail: function(channel) {
      this.errorCount += 1
      if (this.backendPreference === 'local') {
        // avoid too many concurrent requests
        setTimeout(() => {
          ytch.getChannelInfo({ channelId: channel.id }).then(response => {
            this.updateSubscriptionDetails({
              channelThumbnailUrl: this.thumbnailURL(response.authorThumbnails[0].url),
              channelName: channel.name,
              channelId: channel.id
            })
          })
        }, this.errorCount * 500)
      } else {
        setTimeout(() => {
          this.invidiousGetChannelInfo(channel.id).then(response => {
            this.updateSubscriptionDetails({
              channelThumbnailUrl: this.thumbnailURL(response.authorThumbnails[0].url),
              channelName: channel.name,
              channelId: channel.id
            })
          })
        }, this.errorCount * 500)
      }
    },

    goToChannel: function (id) {
      this.$router.push({ path: `/channel/${id}` })
    },

    ...mapActions([
      'showToast',
      'updateProfile',
      'updateSubscriptionDetails',
      'invidiousGetChannelInfo'
    ])
  }
})
