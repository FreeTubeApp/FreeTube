import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'

// I haven't decided which video player I want to use
// Need to expirement with both of them to see which one will work best.
import videojs from 'video.js'
import qualitySelector from '@silvermine/videojs-quality-selector'
import 'videojs-vtt-thumbnails'
import 'videojs-contrib-quality-levels'
import 'videojs-http-source-selector'
// import mediaelement from 'mediaelement'

export default Vue.extend({
  name: 'FtVideoPlayer',
  components: {
    'ft-card': FtCard
  },
  props: {
    format: {
      type: String,
      required: true
    },
    sourceList: {
      type: Array,
      default: null
    },
    dashSrc: {
      type: Array,
      default: null
    },
    hlsSrc: {
      type: Array,
      default: null
    },
    captionList: {
      type: Array,
      default: () => { return [] }
    },
    storyboardSrc: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      id: '',
      player: null,
      useDash: false,
      useHls: false,
      activeSourceList: [],
      dataSetup: {
        aspectRatio: '16:9',
        nativeTextTracks: false,
        plugins: {},
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'liveDisplay',
            'seekToLive',
            'remainingTimeDisplay',
            'customControlSpacer',
            'playbackRateMenuButton',
            'chaptersButton',
            'descriptionsButton',
            'subsCapsButton',
            'audioTrackButton',
            'QualitySelector',
            'pictureInPictureToggle',
            'fullscreenToggle'
          ]
        },
        playbackRates: [
          0.25,
          0.5,
          0.75,
          1,
          1.25,
          1.5,
          1.75,
          2,
          2.25,
          2.5,
          2.75,
          3
        ]
      }
    }
  },
  computed: {
    listType: function () {
      return this.$store.getters.getListType
    },

    videoFormatPreference: function () {
      return this.$store.getters.getVideoFormatPreference
    }
  },
  mounted: function () {
    this.id = this._uid

    this.determineFormatType()
  },
  methods: {
    initializePlayer: function () {
      const videoPlayer = document.getElementById(this.id)
      if (videoPlayer !== null) {
        if (!this.useDash && !this.useHls) {
          qualitySelector(videojs, { showQualitySelectionLabelInControlBar: true })
        }

        this.player = videojs(videoPlayer)

        this.player.vttThumbnails({
          src: this.storyboardSrc
        })

        if (this.useDash) {
          this.dataSetup.plugins.httpSourceSelector = {
            default: 'auto'
          }

          this.player.httpSourceSelector()
        }
      }
    },

    determineFormatType: function () {
      if (this.format === 'dash') {
        this.enableDashFormat()
      } else {
        this.enableLegacyFormat()
      }
    },

    enableDashFormat: function () {
      if (this.dashSrc === null) {
        console.log('No dash format available.')
        return
      }

      this.useDash = true
      this.useHls = false
      this.activeSourceList = this.dashSrc

      setTimeout(this.initializePlayer, 1000)
    },

    enableLegacyFormat: function () {
      if (this.sourceList.length === 0) {
        console.log('No sources available')
        return
      }

      this.useDash = false
      this.useHls = false
      this.activeSourceList = this.sourceList

      setTimeout(this.initializePlayer, 100)
    }
  }
})
