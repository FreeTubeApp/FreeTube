import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'

import $ from 'jquery'
import videojs from 'video.js'
import qualitySelector from '@silvermine/videojs-quality-selector'
import fs from 'fs'
import 'videojs-vtt-thumbnails-freetube'
import 'videojs-contrib-quality-levels'
import 'videojs-http-source-selector'

export default Vue.extend({
  name: 'FtVideoPlayer',
  components: {
    'ft-card': FtCard
  },
  beforeRouteLeave: function () {
    if (this.player !== null && !this.player.isInPictureInPicture()) {
      this.player.dispose()
      this.player = null
      clearTimeout(this.mouseTimeout)
    } else if (this.player.isInPictureInPicture()) {
      this.player.play()
    }
  },
  props: {
    format: {
      type: String,
      required: true
    },
    sourceList: {
      type: Array,
      default: () => { return [] }
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
    },
    thumbnail: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      id: '',
      volume: 1,
      player: null,
      useDash: false,
      useHls: false,
      selectedDefaultQuality: '',
      activeSourceList: [],
      mouseTimeout: null,
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
    defaultPlayback: function () {
      return this.$store.getters.getDefaultPlayback
    },

    defaultQuality: function () {
      return parseInt(this.$store.getters.getDefaultQuality)
    },

    defaultVideoFormat: function () {
      return this.$store.getters.getDefaultVideoFormat
    },

    autoplayVideos: function () {
      return this.$store.getters.getAutoplayVideos
    }
  },
  watch: {
    sourceList: function () {
      this.determineFormatType()
    },
    captionList: function () {
      this.player.caption({
        data: this.captionList
      })
    }
  },
  mounted: function () {
    this.id = this._uid

    const volume = sessionStorage.getItem('volume')

    if (volume !== null) {
      this.volume = volume
    }

    this.determineFormatType()
    this.determineMaxFramerate()
  },
  beforeDestroy: function () {
    if (this.player !== null && !this.player.isInPictureInPicture()) {
      this.player.dispose()
      this.player = null
      clearTimeout(this.mouseTimeout)
    }
  },
  methods: {
    initializePlayer: async function () {
      const videoPlayer = document.getElementById(this.id)
      if (videoPlayer !== null) {
        if (!this.useDash) {
          qualitySelector(videojs, { showQualitySelectionLabelInControlBar: true })
          await this.determineDefaultQualityLegacy()
        }

        this.player = videojs(videoPlayer, {
          html5: {
            vhs: {
              limitRenditionByPlayerDimensions: false
            }
          }
        })

        this.player.volume(this.volume)
        this.player.playbackRate(this.defaultPlayback)

        if (this.storyboardSrc !== '') {
          this.player.vttThumbnails({
            src: this.storyboardSrc,
            showTimestamp: true
          })
        }

        if (this.useDash) {
          this.dataSetup.plugins.httpSourceSelector = {
            default: 'auto'
          }

          this.player.httpSourceSelector()
          setTimeout(() => {
            this.determineDefaultQualityDash()
          }, 400)
        }

        if (this.autoplayVideos) {
          // Calling play() won't happen right away, so a quick timeout will make it function properly.
          setTimeout(() => {
            this.player.play()
          }, 200)
        }

        $(document).on('keydown', this.keyboardShortcutHandler)

        this.player.on('mousemove', this.hideMouseTimeout)
        this.player.on('mouseleave', this.removeMouseTimeout)

        this.player.on('volumechange', this.updateVolume)
        this.player.controlBar.getChild('volumePanel').on('mousewheel', this.mouseScrollVolume)

        const v = this

        this.player.on('ready', function () {
          v.$emit('ready')
        })

        this.player.on('ended', function () {
          v.$emit('ended')
        })

        this.player.on('error', function (error, message) {
          v.$emit('error', error.target.player.error_)
        })
      }
    },

    updateVolume: function (event) {
      const volume = this.player.volume()
      sessionStorage.setItem('volume', volume)
    },

    mouseScrollVolume: function (event) {
      if (event.target) {
        event.preventDefault()

        if (this.player.muted() && event.wheelDelta > 0) {
          this.player.muted(false)
          this.player.volume(0)
        }

        if (!this.player.muted()) {
          if (event.wheelDelta > 0) {
            this.changeVolume(0.05)
          } else if (event.wheelDelta < 0) {
            this.changeVolume(-0.05)
          }
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

    determineMaxFramerate: function() {
      fs.readFile(this.dashSrc[0].url, (err, data) => {
        if (err) throw err
        if (data.includes('frameRate="60"')) {
          this.maxFramerate = 60
        } else {
          this.maxFramerate = 30
        }
      })
    },

    determineDefaultQualityLegacy: function () {
      if (this.useDash) {
        return
      }

      if (this.sourceList.length === 0) {
        return ''
      }

      if (typeof (this.sourceList[0].qualityLabel) === 'number') {
        return ''
      }

      if (this.sourceList[this.sourceList.length - 1].qualityLabel === this.$t('Video.Audio.Low')) {
        this.selectedDefaultQuality = this.sourceList[0].qualityLabel
        return
      }

      let defaultQuality = this.defaultQuality

      if (defaultQuality === 'auto') {
        defaultQuality = 720
      }

      let maxAvailableQuality = parseInt(this.sourceList[this.sourceList.length - 1].qualityLabel.replace(/p|k/, ''))

      if (maxAvailableQuality === 4) {
        maxAvailableQuality = 2160
      }

      if (maxAvailableQuality === 8) {
        maxAvailableQuality = 4320
      }

      if (maxAvailableQuality < defaultQuality) {
        this.selectedDefaultQuality = this.sourceList[this.sourceList.length - 1].qualityLabel
      }

      const reversedList = [].concat(this.sourceList).reverse()

      reversedList.forEach((source, index) => {
        let qualityNumber = parseInt(source.qualityLabel.replace(/p|k/, ''))
        if (qualityNumber === 4) {
          qualityNumber = 2160
        }
        if (qualityNumber === 8) {
          qualityNumber = 4320
        }

        if (defaultQuality === qualityNumber) {
          this.selectedDefaultQuality = source.qualityLabel
        }

        if (index < (this.sourceList.length - 1)) {
          let upperQualityNumber = parseInt(reversedList[index + 1].qualityLabel.replace(/p|k/, ''))
          if (upperQualityNumber === 4) {
            upperQualityNumber = 2160
          }
          if (upperQualityNumber === 8) {
            upperQualityNumber = 4320
          }
          if (defaultQuality >= qualityNumber && defaultQuality < upperQualityNumber) {
            this.selectedDefaultQuality = source.qualityLabel
          }
        } else if (qualityNumber <= defaultQuality) {
          this.selectedDefaultQuality = source.qualityLabel
        }
      })

      if (this.selectedDefaultQuality === '') {
        this.selectedDefaultQuality = this.sourceList[this.sourceList.length - 1].qualityLabel
      }
    },

    determineDefaultQualityDash: function () {
      if (this.defaultQuality === 'auto') {
        return
      }

      this.player.qualityLevels().levels_.sort((a, b) => {
        return a.height - b.height
      }).forEach((ql, index, arr) => {
        const height = ql.height
        const width = ql.width
        const quality = width < height ? width : height
        let upperLevel = null

        if (index < arr.length - 1) {
          upperLevel = arr[index + 1]
        }

        if (this.defaultQuality === quality) {
          ql.enabled = true
        } else if (upperLevel !== null) {
          const upperHeight = upperLevel.height
          const upperWidth = upperLevel.width
          const upperQuality = upperWidth < upperHeight ? upperWidth : upperHeight

          if (this.defaultQuality >= quality && this.defaultQuality < upperQuality) {
            ql.enabled = true
          } else {
            ql.enabled = false
          }
        } else if (index === 0 && quality > this.defaultQuality) {
          ql.enabled = true
        } else if (index === (arr.length - 1) && quality < this.defaultQuality) {
          ql.enabled = true
        } else {
          ql.enabled = false
        }
      })
    },

    enableDashFormat: function () {
      if (this.dashSrc === null) {
        console.log('No dash format available.')
        return
      }

      this.useDash = true
      this.useHls = false
      this.activeSourceList = this.dashSrc

      setTimeout(this.initializePlayer, 100)
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
    },

    togglePlayPause: function () {
      if (this.player.paused()) {
        this.player.play()
      } else {
        this.player.pause()
      }
    },

    changeDurationBySeconds: function (seconds) {
      const currentTime = this.player.currentTime()
      const newTime = currentTime + seconds

      if (newTime < 0) {
        this.player.currentTime(0)
      } else if (newTime > this.player.duration) {
        this.player.currentTime(this.player.duration)
      } else {
        this.player.currentTime(newTime)
      }
    },

    changeDurationByPercentage: function (percentage) {
      const duration = this.player.duration()
      const newTime = duration * percentage

      this.player.currentTime(newTime)
    },

    changePlayBackRate: function (rate) {
      const newPlaybackRate = this.player.playbackRate() + rate

      if (newPlaybackRate >= 0.25 && newPlaybackRate <= 3) {
        this.player.playbackRate(newPlaybackRate)
      }
    },

    framebyframe: function (step) {
      this.player.pause()
      let fps
      // Non-Dash formats are 30fps only
      if (!this.useDash) {
        fps = 30
      } else if (this.player.qualityLevels()[this.player.qualityLevels().selectedIndex].height <= 480) {
        fps = 30
      } else {
        if (this.maxFramerate === 60) {
          fps = 60
        } else {
          fps = 30
        }
      }
      // The 3 lines below were taken from the videojs-framebyframe node module by Helena Rasche
      const frameTime = 1 / fps
      const dist = frameTime * step
      this.player.currentTime(this.player.currentTime() + dist)
    },

    changeVolume: function (volume) {
      const currentVolume = this.player.volume()
      const newVolume = currentVolume + volume

      if (newVolume < 0) {
        this.player.volume(0)
      } else if (newVolume > 1) {
        this.player.volume(1)
      } else {
        this.player.volume(newVolume)
      }
    },

    toggleMute: function () {
      if (this.player.muted()) {
        this.player.muted(false)
      } else {
        this.player.muted(true)
      }
    },

    toggleFullscreen: function () {
      if (this.player.isFullscreen()) {
        this.player.exitFullscreen()
      } else {
        this.player.requestFullscreen()
      }
    },

    toggleCaptions: function () {
      const tracks = this.player.textTracks().tracks_

      if (tracks.length > 1) {
        if (tracks[1].mode === 'showing') {
          tracks[1].mode = 'disabled'
        } else {
          tracks[1].mode = 'showing'
        }
      }
    },

    hideMouseTimeout: function () {
      if (this.id === '') {
        return
      }

      const videoPlayer = $(`#${this.id} video`).get(0)
      if (typeof (videoPlayer) !== 'undefined') {
        videoPlayer.style.cursor = 'default'
        clearTimeout(this.mouseTimeout)
        this.mouseTimeout = window.setTimeout(function () {
          videoPlayer.style.cursor = 'none'
        }, 2650)
      }
    },

    removeMouseTimeout: function () {
      if (this.mouseTimeout !== null) {
        clearTimeout(this.mouseTimeout)
      }
    },

    keyboardShortcutHandler: function (event) {
      const activeInputs = $('.ft-input')

      for (let i = 0; i < activeInputs.length; i++) {
        if (activeInputs[i] === document.activeElement) {
          return
        }
      }

      if (this.player !== null) {
        switch (event.which) {
          case 32:
            // Space Bar
            // Toggle Play/Pause
            event.preventDefault()
            this.togglePlayPause()
            break
          case 74:
            // J Key
            // Rewind by 10 seconds
            event.preventDefault()
            this.changeDurationBySeconds(-10)
            break
          case 75:
            // K Key
            // Toggle Play/Pause
            event.preventDefault()
            this.togglePlayPause()
            break
          case 76:
            // L Key
            // Fast Forward by 10 seconds
            event.preventDefault()
            this.changeDurationBySeconds(10)
            break
          case 79:
            // O Key
            // Decrease playback rate by 0.25x
            event.preventDefault()
            this.changePlayBackRate(-0.25)
            break
          case 80:
            // P Key
            // Increase playback rate by 0.25x
            event.preventDefault()
            this.changePlayBackRate(0.25)
            break
          case 70:
            // F Key
            // Toggle Fullscreen Playback
            event.preventDefault()
            this.toggleFullscreen()
            break
          case 77:
            // M Key
            // Toggle Mute
            event.preventDefault()
            this.toggleMute()
            break
          case 67:
            // C Key
            // Toggle Captions
            event.preventDefault()
            this.toggleCaptions()
            break
          case 38:
            // Up Arrow Key
            // Increase volume
            event.preventDefault()
            this.changeVolume(0.05)
            break
          case 40:
            // Down Arrow Key
            // Descrease Volume
            event.preventDefault()
            this.changeVolume(-0.05)
            break
          case 37:
            // Left Arrow Key
            // Rewind by 5 seconds
            event.preventDefault()
            this.changeDurationBySeconds(-5)
            break
          case 39:
            // Right Arrow Key
            // Fast Foward by 5 seconds
            event.preventDefault()
            this.changeDurationBySeconds(5)
            break
          case 49:
            // 1 Key
            // Jump to 10% in the video
            event.preventDefault()
            this.changeDurationByPercentage(0.1)
            break
          case 50:
            // 2 Key
            // Jump to 20% in the video
            event.preventDefault()
            this.changeDurationByPercentage(0.2)
            break
          case 51:
            // 3 Key
            // Jump to 30% in the video
            event.preventDefault()
            this.changeDurationByPercentage(0.3)
            break
          case 52:
            // 4 Key
            // Jump to 40% in the video
            event.preventDefault()
            this.changeDurationByPercentage(0.4)
            break
          case 53:
            // 5 Key
            // Jump to 50% in the video
            event.preventDefault()
            this.changeDurationByPercentage(0.5)
            break
          case 54:
            // 6 Key
            // Jump to 60% in the video
            event.preventDefault()
            this.changeDurationByPercentage(0.6)
            break
          case 55:
            // 7 Key
            // Jump to 70% in the video
            event.preventDefault()
            this.changeDurationByPercentage(0.7)
            break
          case 56:
            // 8 Key
            // Jump to 80% in the video
            event.preventDefault()
            this.changeDurationByPercentage(0.8)
            break
          case 57:
            // 9 Key
            // Jump to 90% in the video
            event.preventDefault()
            this.changeDurationByPercentage(0.9)
            break
          case 48:
            // 0 Key
            // Jump to 0% in the video (The beginning)
            event.preventDefault()
            this.changeDurationByPercentage(0)
            break
          case 90:
            // Z Key
            // Return to previous frame
            this.framebyframe(-1)
            break
          case 88:
            // X Key
            // Advance to next frame
            this.framebyframe(1)
            break
        }
      }
    }
  }
})
