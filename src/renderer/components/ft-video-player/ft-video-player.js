import Vue from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import { on, off, addClass, removeClass } from 'shorter-js'
import videojs from 'video.js'
import qualitySelector from '@silvermine/videojs-quality-selector'
import fs from 'fs/promises'
import 'videojs-overlay/dist/videojs-overlay'
import 'videojs-overlay/dist/videojs-overlay.css'
import 'videojs-vtt-thumbnails-freetube'
import 'videojs-contrib-quality-levels'
import 'videojs-http-source-selector'
import { $, $$, calculateColorLuminance } from '../../helpers'

export default Vue.extend({
  name: 'FtVideoPlayer',
  components: {
    'ft-card': FtCard
  },
  beforeRouteLeave: function () {
    if (this.player !== null) {
      this.exitFullWindow()
    }
    if (this.player !== null && !this.player.isInPictureInPicture()) {
      this.player.dispose()
      this.player = null
      clearTimeout(this.mouseTimeout)
    } else if (this.player.isInPictureInPicture()) {
      this.player.play()
    }

    if (this.usingElectron && this.powerSaveBlocker !== null) {
      const { ipcRenderer } = require('electron')
      ipcRenderer.invoke('stop-prevent-sleep', this.powerSaveBlocker)
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
      powerSaveBlocker: null,
      volume: 1,
      player: null,
      useDash: false,
      useHls: false,
      selectedDefaultQuality: '',
      selectedQuality: '',
      maxFramerate: 0,
      activeSourceList: [],
      mouseTimeout: null,
      touchTimeout: null,
      lastTouchTime: null,
      dataSetup: {
        fluid: true,
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
            'loopButton',
            'chaptersButton',
            'descriptionsButton',
            'subsCapsButton',
            'audioTrackButton',
            'pictureInPictureToggle',
            'fullWindowButton',
            'qualitySelector',
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
      },
      hideMouse: false
    }
  },
  computed: {
    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },

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

    this.createFullWindowButton()
    this.createLoopButton()
    this.determineFormatType()
    this.determineMaxFramerate()
  },
  beforeDestroy: function () {
    if (this.player !== null) {
      this.exitFullWindow()

      if (!this.player.isInPictureInPicture()) {
        this.player.dispose()
        this.player = null
        clearTimeout(this.mouseTimeout)
      }
    }

    off(document, 'keydown', this.keyboardShortcutHandler)

    if (this.usingElectron && this.powerSaveBlocker !== null) {
      const { ipcRenderer } = require('electron')
      ipcRenderer.invoke('stop-prevent-sleep', this.powerSaveBlocker)
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
              limitRenditionByPlayerDimensions: false,
              smoothQualityChange: false,
              allowSeeksWithinUnsafeLiveWindow: true,
              handlePartialData: true
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
          // this.dataSetup.plugins.httpSourceSelector = {
          // default: 'auto'
          // }

          // this.player.httpSourceSelector()
          this.createDashQualitySelector(this.player.qualityLevels())
        }

        on(document, 'keydown', this.keyboardShortcutHandler)

        this.player.on('mousemove', this.hideMouseTimeout)
        this.player.on('mouseleave', this.removeMouseTimeout)

        this.player.on('volumechange', this.updateVolume)
        this.player.controlBar.getChild('volumePanel').on('mousewheel', this.mouseScrollVolume)

        this.player.on('fullscreenchange', this.fullscreenOverlay)

        const v = this

        this.player.ready(() => {
          v.$emit('ready')
          v.checkAspectRatio()

          if (this.autoplayVideos) {
            this.player.play()
          }
        })

        this.player.on('ended', function () {
          v.$emit('ended')
        })

        this.player.on('error', function (error, message) {
          v.$emit('error', error.target.player.error_)
        })

        this.player.on('play', function () {
          if (this.usingElectron) {
            const { ipcRenderer } = require('electron')
            ipcRenderer.invoke('prevent-sleep').then(blocker => {
              this.powerSaveBlocker = blocker
            })
          }
        })

        this.player.on('pause', function () {
          if (this.usingElectron && this.powerSaveBlocker !== null) {
            const { ipcRenderer } = require('electron')
            ipcRenderer.invoke('stop-prevent-sleep', this.powerSaveBlocker)
            this.powerSaveBlocker = null
          }
        })
      }
    },

    checkAspectRatio() {
      if (this.player === null) {
        return
      }

      const videoWidth = this.player.videoWidth()
      const videoHeight = this.player.videoHeight()

      if (videoWidth === 0 || videoHeight === 0) {
        setTimeout(() => {
          this.checkAspectRatio()
        }, 200)
        return
      }

      if ((videoWidth - videoHeight) <= 240) {
        this.player.fluid(false)
        this.player.aspectRatio('16:9')
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
      if (this.dashSrc.length === 0) {
        this.maxFramerate = 60
        return
      }
      fs.readFile(this.dashSrc[0].url)
        .then(data => {
          this.maxFramerate = data.includes('frameRate="60"')
            ? 60
            : 30
        })
        .catch(() => {
          this.maxFramerate = 60
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
        this.setDashQualityLevel('auto')
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
          this.setDashQualityLevel(height)
        } else if (upperLevel !== null) {
          const upperHeight = upperLevel.height
          const upperWidth = upperLevel.width
          const upperQuality = upperWidth < upperHeight ? upperWidth : upperHeight

          if (this.defaultQuality >= quality && this.defaultQuality < upperQuality) {
            this.setDashQualityLevel(height)
          }
        } else if (index === 0 && quality > this.defaultQuality) {
          this.setDashQualityLevel(height)
        } else if (index === (arr.length - 1) && quality < this.defaultQuality) {
          this.setDashQualityLevel(height)
        }
      })
    },

    setDashQualityLevel: function (qualityLevel) {
      if (this.selectedQuality === qualityLevel) {
        return
      }
      this.player.qualityLevels().levels_.sort((a, b) => {
        return a.height - b.height
      }).forEach((ql, index, arr) => {
        if (qualityLevel === 'auto' || ql.height === qualityLevel) {
          ql.enabled = true
          ql.enabled_(true)
        } else {
          ql.enabled = false
          ql.enabled_(false)
        }
      })

      const selectedQuality = qualityLevel === 'auto' ? 'auto' : qualityLevel + 'p'

      $('#vjs-current-quality').innerText = selectedQuality
      this.selectedQuality = qualityLevel

      for (const element in $$('.quality-item .vjs-menu-item-text')) {
        if (element.innerText === selectedQuality) {
          addClass(element, 'quality-selected')
        } else {
          removeClass(element, 'quality-selected')
        }
      }

      // const currentTime = this.player.currentTime()

      // this.player.currentTime(0)
      // this.player.currentTime(currentTime)
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
      const qualityHeight = this.useDash ? this.player.qualityLevels()[this.player.qualityLevels().selectedIndex].height : 0
      let fps
      // Non-Dash formats are 30fps only
      if (qualityHeight >= 480 && this.maxFramerate === 60) {
        fps = 60
      } else {
        fps = 30
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

    createLoopButton: function () {
      const v = this
      const VjsButton = videojs.getComponent('Button')
      const loopButton = videojs.extend(VjsButton, {
        constructor: function(player, options) {
          VjsButton.call(this, player, options)
        },
        handleClick: function() {
          v.toggleVideoLoop()
        },
        createControlTextEl: function (button) {
          button.innerHTML = '<div title="Toggle Loop" id="loopButton" class="vjs-icon-loop loop-white vjs-button loopWhite"></div>'
        }
      })
      videojs.registerComponent('loopButton', loopButton)
    },

    toggleVideoLoop: async function () {
      const loopButton = $('#loopButton')

      if (!this.player.loop()) {
        const currentTheme = localStorage.getItem('mainColor')
        const colorNames = this.$store.state.utils.colorClasses
        const colorValues = this.$store.state.utils.colorValues

        const nameIndex = colorNames.findIndex((color) => {
          return color === currentTheme
        })

        const themeTextColor = calculateColorLuminance(colorValues[nameIndex])

        if (themeTextColor === '#000000') {
          addClass(loopButton, 'loop-black', 'vjs-icon-loop-active')
          removeClass(loopButton, 'loop-white')
        } else {
          addClass(loopButton, 'vjs-icon-loop-active')
        }

        this.player.loop(true)
      } else {
        removeClass(loopButton, 'vjs-icon-loop-active', 'loop-black', 'loop-white')
        this.player.loop(false)
      }
    },

    createFullWindowButton: function () {
      const v = this
      const VjsButton = videojs.getComponent('Button')
      const fullWindowButton = videojs.extend(VjsButton, {
        constructor: function(player, options) {
          VjsButton.call(this, player, options)
        },
        handleClick: function() {
          v.toggleFullWindow()
        },
        createControlTextEl(button) {
          button.innerHTML = '<div title="Fullwindow" id="fullwindow" class="vjs-icon-fullwindow-enter vjs-button"></div>'
        }
      })
      videojs.registerComponent('fullWindowButton', fullWindowButton)
    },

    createDashQualitySelector: function (levels) {
      const v = this
      if (levels.levels_.length === 0) {
        setTimeout(() => {
          this.createDashQualitySelector(this.player.qualityLevels())
        }, 200)
        return
      }
      const VjsButton = videojs.getComponent('Button')
      const dashQualitySelector = videojs.extend(VjsButton, {
        constructor: function(player, options) {
          VjsButton.call(this, player, options)
        },
        handleClick: function(event) {
          const selectedQuality = event.target.innerText
          const quality = selectedQuality === 'auto' ? 'auto' : parseInt(selectedQuality.replace('p', ''))
          v.setDashQualityLevel(quality)
          // console.log(this.player().qualityLevels())
        },
        createControlTextEl: function (button) {
          const beginningHtml = `<div class="vjs-quality-level-value" title="Select Quality">
           <span id="vjs-current-quality">1080p</span>
          </div>
          <div class="vjs-quality-level-menu vjs-menu">
             <ul class="vjs-menu-content" role="menu">`
          const endingHtml = '</ul></div>'

          let qualityHtml = `<li class="vjs-menu-item quality-item" role="menuitemradio" tabindex="-1" aria-checked="false aria-disabled="false">
            <span class="vjs-menu-item-text">Auto</span>
            <span class="vjs-control-text" aria-live="polite"></span>
          </li>`

          levels.levels_.sort((a, b) => {
            return b.height - a.height
          }).forEach((quality) => {
            qualityHtml = qualityHtml + `<li class="vjs-menu-item quality-item" role="menuitemradio" tabindex="-1" aria-checked="false aria-disabled="false">
              <span class="vjs-menu-item-text">${quality.height}p</span>
              <span class="vjs-control-text" aria-live="polite"></span>
            </li>`
          })
          button.innerHTML = `${beginningHtml}${qualityHtml}${endingHtml}`
        }
      })
      videojs.registerComponent('dashQualitySelector', dashQualitySelector)
      this.player.controlBar.addChild('dashQualitySelector', {}, this.player.controlBar.children_.length - 1)
      this.determineDefaultQualityDash()
    },

    toggleFullWindow: function() {
      if (!this.player.isFullscreen_) {
        const fullWindow = $('#fullwindow')

        if (this.player.isFullWindow) {
          this.player.removeClass('vjs-full-screen')
          this.player.isFullWindow = false
          document.documentElement.style.overflow = this.player.docOrigOverflow
          removeClass(document.body, 'vjs-full-window')
          removeClass(fullWindow, 'vjs-icon-fullwindow-exit')
          this.player.trigger('exitFullWindow')
        } else {
          this.player.addClass('vjs-full-screen')
          this.player.isFullscreen_ = false
          this.player.isFullWindow = true
          this.player.docOrigOverflow = document.documentElement.style.overflow
          document.documentElement.style.overflow = 'hidden'
          addClass(document.body, 'vjs-full-window')
          addClass(fullWindow, 'vjs-icon-fullwindow-exit')
          this.player.trigger('enterFullWindow')
        }
      }
    },

    exitFullWindow: function() {
      if (this.player.isFullWindow) {
        this.player.isFullWindow = false
        document.documentElement.style.overflow = this.player.docOrigOverflow
        this.player.removeClass('vjs-full-screen')
        removeClass(document.body, 'vjs-full-window')
        removeClass($('#fullwindow'), 'vjs-icon-fullwindow-exit')
        this.player.trigger('exitFullWindow')
      }
    },

    toggleFullscreen: function () {
      if (this.player.isFullscreen()) {
        this.player.exitFullscreen()
      } else {
        this.player.requestFullscreen()
      }
    },

    hideMouseTimeout: function () {
      this.hideMouse = false
      clearTimeout(this.mouseTimeout)
      this.mouseTimeout = window.setTimeout(() => {
        this.hideMouse = true
      }, 2650)
    },

    removeMouseTimeout() {
      if (this.mouseTimeout !== null) {
        clearTimeout(this.mouseTimeout)
      }
    },

    fullscreenOverlay() {
      const v = this
      const title = document.title.replace('- FreeTube', '')

      if (this.player.isFullscreen()) {
        this.player.ready(function () {
          v.player.overlay({
            overlays: [{
              showBackground: false,
              content: title,
              start: 'mousemove',
              end: 'userinactive'
            }]
          })
        })
      } else {
        this.player.ready(function () {
          v.player.overlay({
            overlays: [{
              showBackground: false,
              content: ' ',
              start: 'play',
              end: 'loadstart'
            }]
          })
        })
      }
    },

    handleTouchStart: function (event) {
      const v = this
      this.touchPauseTimeout = setTimeout(() => {
        v.togglePlayPause()
      }, 1000)

      const touchTime = new Date()

      if (this.lastTouchTime !== null && (touchTime.getTime() - this.lastTouchTime.getTime()) < 250) {
        this.toggleFullscreen()
      }

      this.lastTouchTime = touchTime
    },

    handleTouchEnd: function (event) {
      clearTimeout(this.touchPauseTimeout)
    },

    keyboardShortcutHandler: function (event) {
      const inputs = new Set(['input', 'select', 'button', 'textarea'])
      const activeElement = document.activeElement

      if (
        (activeElement && inputs.has(activeElement.tagName.toLowerCase())) ||
        event.ctrlKey ||
        this.player === null
      ) {
        return
      }

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
          // Decrease Volume
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
          // Fast Forward by 5 seconds
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
        case 188:
          // , Key
          // Return to previous frame
          this.framebyframe(-1)
          break
        case 190:
          // . Key
          // Advance to next frame
          this.framebyframe(1)
          break
        case 68:
          // D Key
          // Toggle Picture in Picture Mode
          if (!this.player.isInPictureInPicture()) {
            this.player.requestPictureInPicture()
          } else if (this.player.isInPictureInPicture()) {
            this.player.exitPictureInPicture()
          }
          break
        case 27:
          // esc Key
          // Exit full window
          event.preventDefault()
          this.exitFullWindow()
          break
        case 83:
          // S Key
          // Toggle Full Window Mode
          this.toggleFullWindow()
          break
      }
    }
  }
})
