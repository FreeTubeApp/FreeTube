import Vue from 'vue'
import { mapActions } from 'vuex'
import FtCard from '../ft-card/ft-card.vue'
import FtSelect from '../ft-select/ft-select.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtSlider from '../ft-slider/ft-slider.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtTooltip from '../ft-tooltip/ft-tooltip.vue'
import { ipcRenderer } from 'electron'
import { IpcChannels } from '../../../constants'
import path from 'path'

export default Vue.extend({
  name: 'PlayerSettings',
  components: {
    'ft-card': FtCard,
    'ft-select': FtSelect,
    'ft-toggle-switch': FtToggleSwitch,
    'ft-slider': FtSlider,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton,
    'ft-input': FtInput,
    'ft-tooltip': FtTooltip
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
      ],
      playbackRateIntervalValues: [
        0.1,
        0.25,
        0.5,
        1
      ],
      screenshotNames: [
        'PNG',
        'JPEG'
      ],
      screenshotValues: [
        'png',
        'jpg'
      ],
      screenshotFolderPlaceholder: '',
      screenshotFilenameExample: ''
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

    defaultSkipInterval: function () {
      return parseInt(this.$store.getters.getDefaultSkipInterval)
    },

    defaultInterval: function () {
      return parseInt(this.$store.getters.getDefaultInterval)
    },

    defaultVolume: function () {
      return Math.round(parseFloat(this.$store.getters.getDefaultVolume) * 100)
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

    videoVolumeMouseScroll: function () {
      return this.$store.getters.getVideoVolumeMouseScroll
    },

    videoPlaybackRateMouseScroll: function () {
      return this.$store.getters.getVideoPlaybackRateMouseScroll
    },

    displayVideoPlayButton: function () {
      return this.$store.getters.getDisplayVideoPlayButton
    },

    maxVideoPlaybackRate: function () {
      return parseInt(this.$store.getters.getMaxVideoPlaybackRate)
    },

    videoPlaybackRateInterval: function () {
      return this.$store.getters.getVideoPlaybackRateInterval
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
    },

    screenshotFormat: function() {
      return this.$store.getters.getScreenshotFormat
    },

    screenshotQuality: function() {
      return this.$store.getters.getScreenshotQuality
    },

    screenshotFolder: function() {
      return this.$store.getters.getScreenshotFolderPath
    },

    screenshotFilenamePattern: function() {
      return this.$store.getters.getScreenshotFilenamePattern
    }
  },
  mounted: function() {
    this.getScreenshotFolderPlaceholder()
    this.getScreenshotFilenameExample()
  },
  methods: {
    handleUpdateScreenshotFormat: async function(format) {
      await this.updateScreenshotFormat(format)
      this.getScreenshotFilenameExample()
    },

    getScreenshotEmptyFolderPlaceholder: async function() {
      return path.join(await this.getPicturesPath(), 'Freetube')
    },

    getScreenshotFolderPlaceholder: function() {
      if (this.screenshotFolder !== '') {
        this.screenshotFolderPlaceholder = this.screenshotFolder
        return
      }
      this.getScreenshotEmptyFolderPlaceholder().then((res) => {
        this.screenshotFolderPlaceholder = res
      })
    },

    chooseScreenshotFolder: async function() {
      // only use with electron
      const folder = await ipcRenderer.invoke(
        IpcChannels.SHOW_OPEN_DIALOG,
        { properties: ['openDirectory'] }
      )

      if (!folder.canceled) {
        await this.updateScreenshotFolderPath(folder.filePaths[0])
        this.getScreenshotFolderPlaceholder()
      }
    },

    handleScreenshotFilenamePatternChanged: async function(input) {
      if (input) {
        await this.updateScreenshotFilenamePattern(input)
      } else {
        await this.updateScreenshotFilenamePattern('%Y%M%D-%H%N%S')
      }
      this.getScreenshotFilenameExample()
    },

    getScreenshotFilenameExample: function() {
      this.parseScreenshotCustomFileName({
        date: new Date(Date.now()),
        playerTime: 123.456,
        videoId: 'dQw4w9WgXcQ'
      }).then(res => {
        this.screenshotFilenameExample = `${res}.${this.screenshotFormat}`
      }).catch(err => {
        this.screenshotFilenameExample = `❗ ${this.$t(`Settings.Player Settings.Screenshot.Error.${err.message}`)}`
      })
    },

    ...mapActions([
      'updateAutoplayVideos',
      'updateAutoplayPlaylists',
      'updatePlayNextVideo',
      'updateEnableSubtitles',
      'updateForceLocalBackendForLegacy',
      'updateProxyVideos',
      'updateDefaultTheatreMode',
      'updateDefaultSkipInterval',
      'updateDefaultInterval',
      'updateDefaultVolume',
      'updateDefaultPlayback',
      'updateDefaultVideoFormat',
      'updateDefaultQuality',
      'updateVideoVolumeMouseScroll',
      'updateVideoPlaybackRateMouseScroll',
      'updateDisplayVideoPlayButton',
      'updateMaxVideoPlaybackRate',
      'updateVideoPlaybackRateInterval',
      'updateDisplayVideoPlayButton',
      'updateScreenshotFormat',
      'updateScreenshotQuality',
      'updateScreenshotFolderPath',
      'updateScreenshotFilenamePattern',
      'parseScreenshotCustomFileName',
      'getPicturesPath'
    ])
  }
})
