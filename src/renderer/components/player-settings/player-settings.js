import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtSlider from '../ft-slider/ft-slider.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'PlayerSettings',
  components: {
    'ft-card': FtCard,
    'ft-select': FtSelect,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-slider': FtSlider,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {
      formatValues: [
        'dash',
        'legacy',
        'audio'
      ],
      qualityValues: [
        'auto',
        144,
        240,
        360,
        480,
        720,
        1080
      ]
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    autoplayVideos: function () {
      return this.$store.getters.getAutoplayVideos
    },

    autoplayPlaylists: function () {
      return this.$store.getters.getAutoplayPlaylists
    },

    playNextVideo: function () {
      return this.$store.getters.getPlayNextVideo
    },

    enableSubtitles: function () {
      return this.$store.getters.getEnableSubtitles
    },

    forceLocalBackendForLegacy: function () {
      return this.$store.getters.getForceLocalBackendForLegacy
    },

    proxyVideos: function () {
      return this.$store.getters.getProxyVideos
    },

    defaultInterval: function () {
      return parseInt(this.$store.getters.getDefaultInterval)
    },

    defaultVolume: function () {
      return parseFloat(this.$store.getters.getDefaultVolume) * 100
    },

    defaultPlayback: function () {
      return parseFloat(this.$store.getters.getDefaultPlayback)
    },

    defaultVideoFormat: function () {
      return this.$store.getters.getDefaultVideoFormat
    },

    defaultQuality: function () {
      return this.$store.getters.getDefaultQuality
    },

    defaultTheatreMode: function () {
      return this.$store.getters.getDefaultTheatreMode
    },

    hideRecommendedVideos: function () {
      return this.$store.getters.getHideRecommendedVideos
    },

    formatNames: function () {
      return [
        this.$t('Settings.Player Settings.Default Video Format.Dash Formats'),
        this.$t('Settings.Player Settings.Default Video Format.Legacy Formats'),
        this.$t('Settings.Player Settings.Default Video Format.Audio Formats')
      ]
    },

    qualityNames: function () {
      return [
        this.$t('Settings.Player Settings.Default Quality.Auto'),
        this.$t('Settings.Player Settings.Default Quality.144p'),
        this.$t('Settings.Player Settings.Default Quality.240p'),
        this.$t('Settings.Player Settings.Default Quality.360p'),
        this.$t('Settings.Player Settings.Default Quality.480p'),
        this.$t('Settings.Player Settings.Default Quality.720p'),
        this.$t('Settings.Player Settings.Default Quality.1080p')
      ]
    }
  },
  methods: {
    parseVolumeBeforeUpdate: function (volume) {
      this.updateDefaultVolume(volume / 100)
    },

    ...mapActions([
      'updateAutoplayVideos',
      'updateAutoplayPlaylists',
      'updatePlayNextVideo',
      'updateEnableSubtitles',
      'updateForceLocalBackendForLegacy',
      'updateProxyVideos',
      'updateDefaultTheatreMode',
      'updateDefaultInterval',
      'updateDefaultVolume',
      'updateDefaultPlayback',
      'updateDefaultVideoFormat',
      'updateDefaultQuality'
    ])
  }
})
