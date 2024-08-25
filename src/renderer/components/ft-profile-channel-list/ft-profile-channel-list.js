import { defineComponent } from 'vue'
import { mapActions } from 'vuex'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtChannelBubble from '../../components/ft-channel-bubble/ft-channel-bubble.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtPrompt from '../../components/ft-prompt/ft-prompt.vue'
import { deepCopy, showToast } from '../../helpers/utils'
import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'

export default defineComponent({
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
      deletePromptValues: [
        'delete',
        'cancel'
      ]
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
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
        this.$t('Yes, Delete'),
        this.$t('Cancel')
      ]
    },
    locale: function () {
      return this.$i18n.locale.replace('_', '-')
    },
  },
  watch: {
    profile: function () {
      const subscriptions = deepCopy(this.profile.subscriptions).sort((a, b) => {
        return a.name?.toLowerCase().localeCompare(b.name?.toLowerCase(), this.locale)
      })
      subscriptions.forEach((channel) => {
        if (this.backendPreference === 'invidious') {
          channel.thumbnail = youtubeImageUrlToInvidious(channel.thumbnail, this.currentInvidiousInstanceUrl)
        }
        channel.selected = false
      })

      this.subscriptions = subscriptions
      this.selectNone()
    }
  },
  mounted: function () {
    if (typeof this.profile.subscriptions !== 'undefined') {
      const subscriptions = deepCopy(this.profile.subscriptions).sort((a, b) => {
        return a.name?.toLowerCase().localeCompare(b.name?.toLowerCase(), this.locale)
      })
      subscriptions.forEach((channel) => {
        if (this.backendPreference === 'invidious') {
          channel.thumbnail = youtubeImageUrlToInvidious(channel.thumbnail, this.currentInvidiousInstanceUrl)
        }
        channel.selected = false
      })
      this.subscriptions = subscriptions
    }
  },
  methods: {
    displayDeletePrompt: function () {
      if (this.selectedLength === 0) {
        showToast(this.$t('Profile.No channel(s) have been selected'))
      } else {
        this.showDeletePrompt = true
      }
    },

    handleDeletePromptClick: function (value) {
      if (value !== 'cancel' && value !== null) {
        if (this.isMainProfile) {
          const channelsToRemove = this.subscriptions.filter((channel) => channel.selected)
          this.subscriptions = this.subscriptions.filter((channel) => !channel.selected)

          this.profileList.forEach((x) => {
            const profile = deepCopy(x)
            profile.subscriptions = profile.subscriptions.filter((channel) => {
              const index = channelsToRemove.findIndex((y) => y.id === channel.id)

              return index === -1
            })
            this.updateProfile(profile)
          })

          showToast(this.$t('Profile.Profile has been updated'))
          this.selectNone()
        } else {
          const profile = deepCopy(this.profile)

          this.subscriptions = this.subscriptions.filter((channel) => {
            return !channel.selected
          })

          profile.subscriptions = this.subscriptions
          this.selectedLength = 0

          this.updateProfile(profile)

          showToast(this.$t('Profile.Profile has been updated'))
          this.selectNone()
        }
      }
      this.showDeletePrompt = false
    },

    handleChannelClick: function (index) {
      this.subscriptions[index].selected = !this.subscriptions[index].selected
      this.selectedLength = this.subscriptions.filter((channel) => channel.selected).length
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

      this.selectedLength = this.subscriptions.filter((channel) => channel.selected).length
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

      this.selectedLength = this.subscriptions.filter((channel) => channel.selected).length
    },

    ...mapActions([
      'updateProfile'
    ])
  }
})
