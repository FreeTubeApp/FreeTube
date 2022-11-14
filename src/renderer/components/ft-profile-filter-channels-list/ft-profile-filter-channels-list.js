import Vue from 'vue'
import { mapActions } from 'vuex'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtChannelBubble from '../../components/ft-channel-bubble/ft-channel-bubble.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtSelect from '../ft-select/ft-select.vue'
import { showToast } from '../../helpers/utils'

export default Vue.extend({
  name: 'FtProfileFilterChannelsList',
  components: {
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-channel-bubble': FtChannelBubble,
    'ft-button': FtButton,
    'ft-select': FtSelect
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
      selectedLength: 0,
      filteredProfileIndex: 0
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
    profileNameList: function () {
      return this.profileList.flatMap((profile) => profile.name !== this.profile.name ? [profile.name] : [])
    },
    selectedText: function () {
      return this.$t('Profile.{number} selected', { number: this.selectedLength })
    }
  },
  watch: {
    profile: 'updateChannelList',
    filteredProfileIndex: 'updateChannelList'
  },
  mounted: function () {
    if (typeof this.profile.subscriptions !== 'undefined') {
      this.channels = JSON.parse(JSON.stringify(this.profileList[this.filteredProfileIndex].subscriptions)).sort((a, b) => {
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
        if (this.backendPreference === 'invidious') {
          channel.thumbnail = channel.thumbnail.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`)
        }
        channel.selected = false
        return channel
      })
    }
  },
  methods: {
    updateChannelList () {
      this.channels = JSON.parse(JSON.stringify(this.profileList[this.filteredProfileIndex].subscriptions)).sort((a, b) => {
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
        if (this.backendPreference === 'invidious') {
          channel.thumbnail = channel.thumbnail.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`)
        }
        channel.selected = false
        return channel
      })
    },

    handleChannelClick: function (index) {
      this.channels[index].selected = !this.channels[index].selected
      this.selectedLength = this.channels.filter((channel) => {
        return channel.selected
      }).length
    },

    handleProfileFilterChange: function (change) {
      this.filteredProfileIndex = this.profileList.findIndex(profile => profile.name === change)
    },

    addChannelToProfile: function () {
      if (this.selectedLength === 0) {
        showToast(this.$t('Profile.No channel(s) have been selected'))
      } else {
        const subscriptions = this.channels.filter((channel) => {
          return channel.selected
        })

        const profile = JSON.parse(JSON.stringify(this.profile))
        profile.subscriptions = profile.subscriptions.concat(subscriptions)
        this.updateProfile(profile)
        showToast(this.$t('Profile.Profile has been updated'))
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
      'updateProfile'
    ])
  }
})
