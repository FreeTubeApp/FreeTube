import Vue from 'vue'
import { mapActions } from 'vuex'
import FtSettingsSection from '../ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtInputTags from '../../components/ft-input-tags/ft-input-tags.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'PlayerSettings',
  components: {
    'ft-settings-section': FtSettingsSection,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-input-tags': FtInputTags,
    'ft-flex-box': FtFlexBox
  },
  computed: {
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
    hideLiveStreams: function() {
      return this.$store.getters.getHideLiveStreams
    },
    hideSharingActions: function () {
      return this.$store.getters.getHideSharingActions
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    hideChapters: function () {
      return this.$store.getters.getHideChapters
    },
    hideSpecificChannels: function () {
      if (this.$store.getters.getHideSpecificChannels === '') {
        return []
      } else {
        return JSON.parse(this.$store.getters.getHideSpecificChannels)
      }
    }
  },
  methods: {
    handleHideRecommendedVideos: function (value) {
      if (value) {
        this.updatePlayNextVideo(false)
      }

      this.updateHideRecommendedVideos(value)
    },
    handleHideSpecificChannels: function(value) {
      this.updateHideSpecificChannels(JSON.stringify(value))
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
      'updateHideLiveStreams',
      'updateHideSharingActions',
      'updateHideChapters',
      'updateHideSpecificChannels'
    ])
  }
})
