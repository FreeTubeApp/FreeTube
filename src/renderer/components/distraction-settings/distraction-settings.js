import { defineComponent } from 'vue'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInputTags from '../../components/ft-input-tags/ft-input-tags.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import { useSettingsStore } from '../../store'

export default defineComponent({
  name: 'PlayerSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-input-tags': FtInputTags,
    'ft-flex-box': FtFlexBox
  },
  setup() {
    const settingsStore = useSettingsStore()
    return { settingsStore }
  },
  computed: {
    hideVideoViews: function () {
      return this.settingsStore.hideVideoViews
    },
    hideVideoLikesAndDislikes: function () {
      return this.settingsStore.hideVideoLikesAndDislikes
    },
    hideChannelSubscriptions: function () {
      return this.settingsStore.hideChannelSubscriptions
    },
    hideCommentLikes: function () {
      return this.settingsStore.hideCommentLikes
    },
    hideRecommendedVideos: function () {
      return this.settingsStore.hideRecommendedVideos
    },
    hideTrendingVideos: function () {
      return this.settingsStore.hideTrendingVideos
    },
    hidePopularVideos: function () {
      return this.settingsStore.hidePopularVideos
    },
    hidePlaylists: function () {
      return this.settingsStore.hidePlaylists
    },
    hideLiveChat: function () {
      return this.settingsStore.hideLiveChat
    },
    hideActiveSubscriptions: function () {
      return this.settingsStore.hideActiveSubscriptions
    },
    hideVideoDescription: function () {
      return this.settingsStore.hideVideoDescription
    },
    hideComments: function () {
      return this.settingsStore.hideComments
    },
    hideLiveStreams: function() {
      return this.settingsStore.hideLiveStreams
    },
    hideUpcomingPremieres: function () {
      return this.settingsStore.hideUpcomingPremieres
    },
    hideSharingActions: function () {
      return this.settingsStore.hideSharingActions
    },
    backendPreference: function () {
      return this.settingsStore.backendPreference
    },
    hideChapters: function () {
      return this.settingsStore.hideChapters
    },
    showDistractionFreeTitles: function () {
      return this.settingsStore.showDistractionFreeTitles
    },
    channelsHidden: function () {
      return JSON.parse(this.settingsStore.channelsHidden)
    }
  },
  methods: {
    handleHideRecommendedVideos: function (value) {
      if (value) {
        this.settingsStore.playNextVideo = false
      }
      this.settingsStore.hideRecommendedVideos = value
    },

    handleChannelsHidden: function(value) {
      this.settingsStore.channelsHidden = JSON.stringify(value)
    }
  }
})
