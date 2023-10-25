import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInputTags from '../../components/ft-input-tags/ft-input-tags.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import { invidiousAPICall } from '../../helpers/api/invidious'
import { getLocalChannel } from '../../helpers/api/local'

export default defineComponent({
  name: 'PlayerSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-input-tags': FtInputTags,
    'ft-flex-box': FtFlexBox,
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
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
    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },
    blurThumbnails: function () {
      return this.$store.getters.getBlurThumbnails
    },
    channelsHidden: function () {
      let hidden = JSON.parse(this.$store.getters.getChannelsHidden)
      hidden = hidden.map((ch) => {
        // Legacy support
        if (typeof ch === 'string') {
          return { name: ch, secondaryName: '', description: '' }
        }
        return ch
      })
      return hidden
    },
    hideSubscriptionsLiveTooltip: function () {
      return this.$t('Tooltips.Distraction Free Settings.Hide Subscriptions Live', {
        appWideSetting: this.$t('Settings.Distraction Free Settings.Hide Live Streams'),
        subsection: this.$t('Settings.Distraction Free Settings.Sections.General'),
        settingsSection: this.$t('Settings.Distraction Free Settings.Distraction Free Settings')
      })
    }
  },
  methods: {
    handleHideRecommendedVideos: function (value) {
      if (value) {
        this.updatePlayNextVideo(false)
      }

      this.updateHideRecommendedVideos(value)
    },
    handleChannelsHidden: function (value) {
      this.updateChannelsHidden(JSON.stringify(value))
    },
    findChannelNameById: async function (text) {
      try {
        if (this.backendPreference === 'invidious') {
          const channelPayload = {
            resource: 'channels',
            id: text,
            params: {}
          }
          const res = await invidiousAPICall(channelPayload)
          return res.author
        } else {
          const channel = await getLocalChannel(text)
          return channel.header.author.name
        }
      } catch (_) {
        // Will generally throw errors if a non channel ID is provided
        return ''
      }
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
      'updateDefaultTheatreMode',
      'updateHideVideoDescription',
      'updateHideComments',
      'updateHideCommentPhotos',
      'updateHideLiveStreams',
      'updateHideUpcomingPremieres',
      'updateHideSharingActions',
      'updateHideChapters',
      'updateChannelsHidden',
      'updateShowDistractionFreeTitles',
      'updateHideFeaturedChannels',
      'updateHideChannelShorts',
      'updateHideChannelPlaylists',
      'updateHideChannelCommunity',
      'updateHideChannelPodcasts',
      'updateHideChannelReleases',
      'updateHideSubscriptionsVideos',
      'updateHideSubscriptionsShorts',
      'updateHideSubscriptionsLive',
      'updateHideSubscriptionsCommunity',
      'updateBlurThumbnails'
    ])
  }
})
