import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import SideNavMoreOptions from '../side-nav-more-options/side-nav-more-options.vue'
import { getLocalChannel } from '../../helpers/api/local'
import { invidiousGetChannelInfo, youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { deepCopy } from '../../helpers/utils'
import { MiscConstants } from '../../../constants'

export default defineComponent({
  name: 'SideNav',
  components: {
    'ft-flex-box': FtFlexBox,
    'side-nav-more-options': SideNavMoreOptions
  },
  data: function () {
    return {
      errorCount: 0,
      updatingChannels: new Set()
    }
  },
  computed: {
    isOpen: function () {
      return this.$store.getters.getIsSideNavOpen
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },
    profileList: function () {
      return this.$store.getters.getProfileList
    },
    activeProfile: function () {
      return this.$store.getters.getActiveProfile
    },
    locale: function () {
      return this.$i18n.locale.replace('_', '-')
    },
    activeSubscriptions: function () {
      const subscriptions = deepCopy(this.activeProfile.subscriptions)

      subscriptions.sort((a, b) => {
        return a.name?.toLowerCase().localeCompare(b.name?.toLowerCase(), this.locale)
      })
      subscriptions.forEach((channel) => {
        if (channel.thumbnail === null) {
          this.updateThumbnail(channel)
        } else if (this.backendPreference === 'invidious') {
          channel.thumbnail = youtubeImageUrlToInvidious(channel.thumbnail, this.currentInvidiousInstance)
        }
      })

      return subscriptions
    },
    hidePopularVideos: function () {
      return this.$store.getters.getHidePopularVideos
    },
    hidePlaylists: function () {
      return this.$store.getters.getHidePlaylists
    },
    hideTrendingVideos: function () {
      return this.$store.getters.getHideTrendingVideos
    },
    hideActiveSubscriptions: function () {
      return this.$store.getters.getHideActiveSubscriptions
    },
    hideLabelsSideBar: function () {
      return this.$store.getters.getHideLabelsSideBar
    },
    hideText: function () {
      return !this.isOpen && this.hideLabelsSideBar
    },
    applyNavIconExpand: function() {
      return {
        navIconExpand: this.hideText
      }
    },
    applyHiddenLabels: function() {
      return {
        hiddenLabels: this.hideText
      }
    }
  },
  created () {
    this.CHANNEL_IMAGE_BROKEN = MiscConstants.CHANNEL_IMAGE_BROKEN
    this.CHANNEL_IMAGE_NOT_EXISTENT = MiscConstants.CHANNEL_IMAGE_NOT_EXISTENT
  },
  methods: {
    updateThumbnail: function(channel) {
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
              }).catch(() => {
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
                  // channel is likely deleted. We will show a default icon instead from now on.
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
    },

    ...mapActions([
      'updateSubscriptionDetails'
    ])
  }
})
