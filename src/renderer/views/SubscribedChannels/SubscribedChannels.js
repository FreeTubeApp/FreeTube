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
      hasQuery: false,
      allChannels: [],
      filteredChannels: [],
      reURL: /(.+=\w{1})\d+(.+)/,
      thumbnailSize: 176
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
      if (this.hasQuery) {
        return this.filteredChannels
      } else {
        return this.allChannels
      }
    },

    locale: function () {
      return this.$store.getters.getCurrentLocale.replace('_', '-')
    }
  },
  watch: {
    activeProfileId: function() {
      this.clearFilter()
      this.getAllChannels()
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

    filterChannels: function (query) {
      this.hasQuery = query !== ''

      if (query === '') {
        this.filteredChannels = []
        return
      }

      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(escapedQuery, 'i')
      this.filteredChannels = this.allChannels.filter(channel => {
        return re.test(channel.name)
      })
    },

    clearFilter: function () {
      this.$refs.searchBarChannels.inputData = ''
      this.hasQuery = false
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
      // Saved thumbnail quality is inconsistent (48, 76, 100 or 176)
      return originalURL.replace(this.reURL, `$1${this.thumbnailSize}$2`)
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
