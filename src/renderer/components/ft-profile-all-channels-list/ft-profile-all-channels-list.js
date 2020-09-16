import Vue from 'vue'
import { mapActions } from 'vuex'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtChannelBubble from '../../components/ft-channel-bubble/ft-channel-bubble.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtPrompt from '../../components/ft-prompt/ft-prompt.vue'

export default Vue.extend({
  name: 'FtProfileAllChannelsList',
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
    }
  },
  data: function () {
    return {
      channels: [],
      selectedLength: 0
    }
  },
  computed: {
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    selectedText: function () {
      const localeText = this.$t('Profile.$ selected')
      return localeText.replace('$', this.selectedLength)
    }
  },
  watch: {
    profile: function () {
      this.channels = [].concat(this.profileList[0].subscriptions).sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        if (nameA < nameB) {
          return -1
        }
        if (nameA > nameB) {
          return 1
        }
        return 0
      }).filter((channel) => {
        const index = this.profile.subscriptions.findIndex((sub) => {
          return sub.id === channel.id
        })

        return index === -1
      }).map((channel) => {
        channel.selected = false
        return channel
      })
    }
  },
  mounted: function () {
    if (typeof this.profile.subscriptions !== 'undefined') {
      this.channels = [].concat(this.profileList[0].subscriptions).sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        if (nameA < nameB) {
          return -1
        }
        if (nameA > nameB) {
          return 1
        }
        return 0
      }).filter((channel) => {
        const index = this.profile.subscriptions.findIndex((sub) => {
          return sub.id === channel.id
        })

        return index === -1
      }).map((channel) => {
        channel.selected = false
        return channel
      })
    }
  },
  methods: {
    handleChannelClick: function (index) {
      this.channels[index].selected = !this.channels[index].selected
      this.selectedLength = this.channels.filter((channel) => {
        return channel.selected
      }).length
    },

    addChannelToProfile: function () {
      if (this.selectedLength === 0) {
        this.showToast({
          message: this.$t('Profile.No channel(s) have been selected')
        })
      } else {
        const subscriptions = this.channels.filter((channel) => {
          return channel.selected
        })

        const profile = JSON.parse(JSON.stringify(this.profile))
        profile.subscriptions = profile.subscriptions.concat(subscriptions)
        this.updateProfile(profile)
        this.showToast({
          message: this.$t('Profile.Profile has been updated')
        })
        this.selectNone()
      }
    },

    selectAll: function () {
      Object.keys(this.$refs).forEach((ref) => {
        if (typeof this.$refs[ref][0] !== 'undefined') {
          this.$refs[ref][0].selected = true
        }
      })

      this.channels = this.channels.map((channel) => {
        channel.selected = true
        return channel
      })

      this.selectedLength = this.channels.filter((channel) => {
        return channel.selected
      }).length
    },

    selectNone: function () {
      Object.keys(this.$refs).forEach((ref) => {
        if (typeof this.$refs[ref][0] !== 'undefined') {
          this.$refs[ref][0].selected = false
        }
      })

      this.channels = this.channels.map((channel) => {
        channel.selected = false
        return channel
      })

      this.selectedLength = this.channels.filter((channel) => {
        return channel.selected
      }).length
    },

    ...mapActions([
      'showToast',
      'updateProfile'
    ])
  }
})
