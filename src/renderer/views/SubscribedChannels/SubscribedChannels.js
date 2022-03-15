import Vue from 'vue'
import { mapActions } from 'vuex'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'

export default Vue.extend({
  name: 'SubscribedChannels',
  components: {
    'ft-button': FtButton,
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-input': FtInput
  },
  data: function () {
    return {
      query: '',
      allChannels: [],
      filteredChannels: [],
      re: {
        url: /(.+=\w{1})\d+(.+)/,
        ivToIv: /(.+)(ggpht.+)/,
        ivToYt: /(.+ggpht\/{2})(.+)/,
        ytToIv: /(.+)(ytc.+)/
      },
      thumbnailSize: 176,
      ytBaseURL: 'https://yt3.ggpht.com'
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

    channelsList: function () {
      if (this.query !== '') {
        return this.filteredChannels
      } else {
        return this.allChannels
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
    }
  },
  watch: {
    activeProfileId: function() {
      this.clearFilter()
      this.getAllChannels()
    },
    activeSubscriptionList: function() {
      this.getAllChannels()
      this.filterChannels()
    }
  },
  mounted: function () {
    this.getAllChannels()
  },
  methods: {
    getAllChannels: function () {
      this.allChannels = this.activeSubscriptionList.slice().sort((a, b) => {
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
      this.filteredChannels = this.allChannels.filter(channel => {
        return re.test(channel.name)
      })
    },

    clearFilter: function () {
      this.$refs.searchBarChannels.inputData = ''
      this.query = ''
    },

    unsubscribeChannel: function (id, name) {
      const currentProfile = JSON.parse(JSON.stringify(this.activeProfile))
      let index = currentProfile.subscriptions.findIndex(channel => {
        return channel.id === id
      })
      currentProfile.subscriptions.splice(index, 1)

      this.updateProfile(currentProfile)
      this.showToast({
        message: this.$t('Channels.Unsubscribed').replace('$', name)
      })

      index = this.allChannels.findIndex(channel => {
        return channel.id === id
      })
      this.allChannels.splice(index, 1)

      index = this.filteredChannels.findIndex(channel => {
        return channel.id === id
      })
      if (index !== -1) {
        this.filteredChannels.splice(index, 1)
      }
    },

    thumbnailURL: function(originalURL) {
      let newURL = originalURL
      if (originalURL.indexOf('ggpht//') > -1) {
        if (this.backendPreference === 'local') {
          // IV to YT
          newURL = originalURL.replace(this.re.ivToYt, `${this.ytBaseURL}/$2`)
        } else {
          // IV to IV
          newURL = originalURL.replace(this.re.ivToIv, `${this.currentInvidiousInstance}/$2`)
        }
      } else {
        if (this.backendPreference === 'invidious') {
          // YT to IV
          newURL = originalURL.replace(this.re.ytToIv, `${this.currentInvidiousInstance}/ggpht//$2`)
        }
      }

      // Saved thumbnail quality is inconsistent (48, 76, 100 or 176)
      return newURL.replace(this.re.url, `$1${this.thumbnailSize}$2`)
    },

    goToChannel: function (id) {
      this.$router.push({ path: `/channel/${id}` })
    },

    ...mapActions([
      'showToast',
      'updateProfile'
    ])
  }
})
