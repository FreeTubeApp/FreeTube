import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'PlayerSettings',
  components: {
    'ft-card': FtCard,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-button': FtButton,
    'ft-select': FtSelect,
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
    }
  },
  methods: {
    handleHideRecommendedVideos: function (value) {
      if (value) {
        this.updatePlayNextVideo(false)
      }

      this.updateHideRecommendedVideos(value)
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
      'updateDefaultTheatreMode'
    ])
  }
})
