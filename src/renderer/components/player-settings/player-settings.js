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
      title: 'Player Settings',
      formatNames: [
        'Dash Formats',
        'Legacy Formats',
        'YouTube Player'
      ],
      formatValues: [
        'dash',
        'legacy',
        'youtube'
      ],
      qualityNames: [
        'Auto',
        '144p',
        '240p',
        '360p',
        '480p',
        '720p',
        '1080p',
        '1440p',
        '4k',
        '8k'
      ],
      qualityValues: [
        'auto',
        '144',
        '240',
        '360',
        '480',
        '720',
        '1080',
        '1440',
        '4k',
        '8k'
      ]
    }
  },
  computed: {
    rememberHistory: function () {
      return this.$store.getters.getRememberHistory
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
    }
  },
  methods: {
    parseVolumeBeforeUpdate: function (volume) {
      this.updateDefaultVolume(volume / 100)
    },

    ...mapActions([
      'updateRememberHistory',
      'updateAutoplayVideos',
      'updateAutoplayPlaylists',
      'updatePlayNextVideo',
      'updateEnableSubtitles',
      'updateForceLocalBackendForLegacy',
      'updateProxyVideos',
      'updateDefaultTheatreMode',
      'updateDefaultVolume',
      'updateDefaultPlayback',
      'updateDefaultVideoFormat',
      'updateDefaultQuality'
    ])
  }
})
