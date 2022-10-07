import Vue from 'vue'
import { mapActions } from 'vuex'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtChannelBubble from '../../components/ft-channel-bubble/ft-channel-bubble.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtPrompt from '../../components/ft-prompt/ft-prompt.vue'

export default Vue.extend({
  name: 'FtProfileChannelList',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-channel-bubble': FtChannelBubble,
    'ft-button': FtButton,
    'ft-prompt': FtPrompt
  },
  props: {
    profile: {
      type: Object,
      required: true
    },
    isMainProfile: {
      type: Boolean,
      required: true
    }
  },
  data: function () {
    return {
      showDeletePrompt: false,
      subscriptions: [],
      selectedLength: 0,
      componentKey: 0,
      deletePromptValues: [
        'yes',
        'no'
      ]
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    selectedText: function () {
      return this.$t('Profile.{number} selected', { number: this.selectedLength })
    },
    deletePromptMessage: function () {
      if (this.isMainProfile) {
        return this.$t('Profile["This is your primary profile.  Are you sure you want to delete the selected channels?  The same channels will be deleted in any profile they are found in."]')
      } else {
        return this.$t('Profile["Are you sure you want to delete the selected channels?  This will not delete the channel from any other profile."]')
      }
    },
    deletePromptNames: function () {
      return [
        this.$t('Yes'),
        this.$t('No')
      ]
    }
  },
  watch: {
    profile: function () {
      this.subscriptions = JSON.parse(JSON.stringify(this.profile.subscriptions)).sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        if (nameA < nameB) {
          return -1
        }
        if (nameA > nameB) {
          return 1
        }
        return 0
      }).map((channel) => {
        if (this.backendPreference === 'invidious') {
          channel.thumbnail = channel.thumbnail.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`)
        }
        channel.selected = false
        return channel
      })
    }
  },
  mounted: function () {
    if (typeof this.profile.subscriptions !== 'undefined') {
      this.subscriptions = JSON.parse(JSON.stringify(this.profile.subscriptions)).sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        if (nameA < nameB) {
          return -1
        }
        if (nameA > nameB) {
          return 1
        }
        return 0
      }).map((channel) => {
        if (this.backendPreference === 'invidious') {
          channel.thumbnail = channel.thumbnail.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`)
        }
        channel.selected = false
        return channel
      })
    }
  },
  methods: {
    displayDeletePrompt: function () {
      if (this.selectedLength === 0) {
        this.showToast({
          message: this.$t('Profile.No channel(s) have been selected')
        })
      } else {
        this.showDeletePrompt = true
      }
    },

    handleDeletePromptClick: function (value) {
      if (value !== 'no' && value !== null) {
        if (this.isMainProfile) {
          const channelsToRemove = this.subscriptions.filter((channel) => {
            return channel.selected
          })

          this.subscriptions = this.subscriptions.filter((channel) => {
            return !channel.selected
          })

          this.profileList.forEach((x) => {
            const profile = JSON.parse(JSON.stringify(x))
            profile.subscriptions = profile.subscriptions.filter((channel) => {
              const index = channelsToRemove.findIndex((y) => {
                return y.id === channel.id
              })

              return index === -1
            })
            this.updateProfile(profile)
          })

          this.showToast({
            message: this.$t('Profile.Profile has been updated')
          })
          this.selectNone()
        } else {
          const profile = JSON.parse(JSON.stringify(this.profile))

          this.subscriptions = this.subscriptions.filter((channel) => {
            return !channel.selected
          })

          profile.subscriptions = this.subscriptions
          this.selectedLength = 0

          this.updateProfile(profile)

          this.showToast({
            message: this.$t('Profile.Profile has been updated')
          })
          this.selectNone()
        }
      }
      this.showDeletePrompt = false
    },

    handleChannelClick: function (index) {
      this.subscriptions[index].selected = !this.subscriptions[index].selected
      this.selectedLength = this.subscriptions.filter((channel) => {
        return channel.selected
      }).length
    },

    selectAll: function () {
      Object.keys(this.$refs).forEach((ref) => {
        if (typeof this.$refs[ref][0] !== 'undefined') {
          this.$refs[ref][0].selected = true
        }
      })

      this.subscriptions = this.subscriptions.map((channel) => {
        channel.selected = true
        return channel
      })

      this.selectedLength = this.subscriptions.filter((channel) => {
        return channel.selected
      }).length
    },

    selectNone: function () {
      Object.keys(this.$refs).forEach((ref) => {
        if (typeof this.$refs[ref][0] !== 'undefined') {
          this.$refs[ref][0].selected = false
        }
      })

      this.subscriptions = this.subscriptions.map((channel) => {
        channel.selected = false
        return channel
      })

      this.selectedLength = this.subscriptions.filter((channel) => {
        return channel.selected
      }).length
    },

    ...mapActions([
      'showToast',
      'updateProfile'
    ])
  }
})
