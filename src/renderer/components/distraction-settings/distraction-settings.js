import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInputTags from '../../components/ft-input-tags/ft-input-tags.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import { showToast } from '../../helpers/utils'
import { checkYoutubeChannelId, findChannelTagInfo } from '../../helpers/channels'

export default defineComponent({
  name: 'PlayerSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-input-tags': FtInputTags,
    'ft-flex-box': FtFlexBox,
  },
  data: function () {
    return {
      channelHiderDisabled: false,
    }
  },
  computed: {
    backendOptions: function () {
      return {
        preference: this.$store.getters.getBackendPreference,
        fallback: this.$store.getters.getBackendFallback
      }
    },
    hideVideoViews: function () {
      return this.$store.getters.getHideVideoViews
    },
    hideVideoLikesAndDislikes: function () {
      return this.$store.getters.getHideVideoLikesAndDislikes
    },
    hideChannelSubscriptions: function () {
      return this.$store.getters.getHideChannelSubscriptions
    },
    hideCommentLikes: function () {
      return this.$store.getters.getHideCommentLikes
    },
    hideRecommendedVideos: function () {
      return this.$store.getters.getHideRecommendedVideos
    },
    hideTrendingVideos: function () {
      return this.$store.getters.getHideTrendingVideos
    },
    hidePopularVideos: function () {
      return this.$store.getters.getHidePopularVideos
    },
    hidePlaylists: function () {
      return this.$store.getters.getHidePlaylists
    },
    hideLiveChat: function () {
      return this.$store.getters.getHideLiveChat
    },
    hideActiveSubscriptions: function () {
      return this.$store.getters.getHideActiveSubscriptions
    },
    hideVideoDescription: function () {
      return this.$store.getters.getHideVideoDescription
    },
    hideComments: function () {
      return this.$store.getters.getHideComments
    },
    hideCommentPhotos: function () {
      return this.$store.getters.getHideCommentPhotos
    },
    hideLiveStreams: function () {
      return this.$store.getters.getHideLiveStreams
    },
    hideUpcomingPremieres: function () {
      return this.$store.getters.getHideUpcomingPremieres
    },
    hideSharingActions: function () {
      return this.$store.getters.getHideSharingActions
    },
    hideChapters: function () {
      return this.$store.getters.getHideChapters
    },
    hideFeaturedChannels: function () {
      return this.$store.getters.getHideFeaturedChannels
    },
    hideChannelShorts: function () {
      return this.$store.getters.getHideChannelShorts
    },
    hideChannelPlaylists: function () {
      return this.$store.getters.getHideChannelPlaylists
    },
    hideChannelPodcasts: function () {
      return this.$store.getters.getHideChannelPodcasts
    },
    hideChannelReleases: function () {
      return this.$store.getters.getHideChannelReleases
    },
    hideChannelCommunity: function () {
      return this.$store.getters.getHideChannelCommunity
    },
    hideChannelHome: function () {
      return this.$store.getters.getHideChannelHome
    },
    hideSubscriptionsVideos: function () {
      return this.$store.getters.getHideSubscriptionsVideos
    },
    hideSubscriptionsShorts: function () {
      return this.$store.getters.getHideSubscriptionsShorts
    },
    hideSubscriptionsLive: function () {
      return this.$store.getters.getHideSubscriptionsLive
    },
    hideSubscriptionsCommunity: function () {
      return this.$store.getters.getHideSubscriptionsCommunity
    },
    showDistractionFreeTitles: function () {
      return this.$store.getters.getShowDistractionFreeTitles
    },
    showAddedChannelsHidden: function () {
      return this.$store.getters.getShowAddedChannelsHidden
    },
    showAddedForbiddenTitles: function () {
      return this.$store.getters.getShowAddedForbiddenTitles
    },
    channelsHidden: function () {
      return JSON.parse(this.$store.getters.getChannelsHidden).map((ch) => {
        // Legacy support
        if (typeof ch === 'string') {
          return { name: ch, preferredName: '', icon: '' }
        }
        return ch
      })
    },
    forbiddenTitles: function() {
      return JSON.parse(this.$store.getters.getForbiddenTitles)
    },
    hideSubscriptionsLiveTooltip: function () {
      return this.$t('Tooltips.Distraction Free Settings.Hide Subscriptions Live', {
        appWideSetting: this.$t('Settings.Distraction Free Settings.Hide Live Streams'),
        subsection: this.$t('Settings.Distraction Free Settings.Sections.General'),
        settingsSection: this.$t('Settings.Distraction Free Settings.Distraction Free Settings')
      })
    },
  },
  mounted: function () {
    this.verifyChannelsHidden()
  },
  methods: {
    handleHideRecommendedVideos: function (value) {
      if (value) {
        this.updatePlayNextVideo(false)
      }

      this.updateHideRecommendedVideos(value)
    },
    handleInvalidChannel: function () {
      showToast(this.$t('Settings.Distraction Free Settings.Hide Channels Invalid'))
    },
    handleChannelAPIError: function () {
      showToast(this.$t('Settings.Distraction Free Settings.Hide Channels API Error'))
    },
    handleChannelsHidden: function (value) {
      this.updateChannelsHidden(JSON.stringify(value))
    },
    handleForbiddenTitles: function (value) {
      this.updateForbiddenTitles(JSON.stringify(value))
    },
    handleChannelsExists: function () {
      showToast(this.$t('Settings.Distraction Free Settings.Hide Channels Already Exists'))
    },
    handleAddedChannelsHidden: function () {
      this.updateShowAddedChannelsHidden(!this.showAddedChannelsHidden)
    },
    handleAddedForbiddenTitles: function () {
      this.updateShowAddedForbiddenTitles(!this.showAddedForbiddenTitles)
    },
    validateChannelId: function (text) {
      return checkYoutubeChannelId(text)
    },
    findChannelTagInfo: async function (text) {
      return await findChannelTagInfo(text, this.backendOptions)
    },
    verifyChannelsHidden: async function () {
      const channelsHiddenCpy = [...this.channelsHidden]

      for (let i = 0; i < channelsHiddenCpy.length; i++) {
        const tag = this.channelsHidden[i]

        // if channel has been processed and confirmed as non existent, skip
        if (tag.invalid) continue

        // process if no preferred name and is possibly a YouTube ID
        if ((tag.preferredName === '' || !tag.icon) && checkYoutubeChannelId(tag.name)) {
          this.channelHiderDisabled = true

          const { preferredName, icon, iconHref, invalidId } = await this.findChannelTagInfo(tag.name)
          if (invalidId) {
            channelsHiddenCpy[i] = { name: tag.name, invalid: invalidId }
          } else {
            channelsHiddenCpy[i] = { name: tag.name, preferredName, icon, iconHref }
          }

          // update on every tag in case it closes
          this.handleChannelsHidden(channelsHiddenCpy)
        }
      }

      this.channelHiderDisabled = false
    },

    ...mapActions([
      'updateHideVideoViews',
      'updateHideVideoLikesAndDislikes',
      'updateHideChannelSubscriptions',
      'updateHideCommentLikes',
      'updateHideRecommendedVideos',
      'updateHideTrendingVideos',
      'updateHidePopularVideos',
      'updateHidePlaylists',
      'updateHideLiveChat',
      'updateHideActiveSubscriptions',
      'updatePlayNextVideo',
      'updateHideVideoDescription',
      'updateHideComments',
      'updateHideCommentPhotos',
      'updateHideLiveStreams',
      'updateHideUpcomingPremieres',
      'updateHideSharingActions',
      'updateHideChapters',
      'updateChannelsHidden',
      'updateForbiddenTitles',
      'updateShowDistractionFreeTitles',
      'updateHideFeaturedChannels',
      'updateHideChannelShorts',
      'updateHideChannelPlaylists',
      'updateHideChannelCommunity',
      'updateHideChannelHome',
      'updateHideChannelPodcasts',
      'updateHideChannelReleases',
      'updateHideSubscriptionsVideos',
      'updateHideSubscriptionsShorts',
      'updateHideSubscriptionsLive',
      'updateHideSubscriptionsCommunity',
      'updateShowAddedChannelsHidden',
      'updateShowAddedForbiddenTitles',
    ])
  }
})
