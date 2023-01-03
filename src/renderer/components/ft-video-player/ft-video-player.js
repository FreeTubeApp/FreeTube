import Vue from 'vue'
import { mapActions } from 'vuex'

import videojs from 'video.js'
import qualitySelector from '@silvermine/videojs-quality-selector'
import fs from 'fs/promises'
import path from 'path'
import 'videojs-overlay/dist/videojs-overlay'
import 'videojs-overlay/dist/videojs-overlay.css'
import 'videojs-vtt-thumbnails-freetube'
import 'videojs-contrib-quality-levels'
import 'videojs-http-source-selector'
import 'videojs-mobile-ui'
import 'videojs-mobile-ui/dist/videojs-mobile-ui.css'
import { IpcChannels } from '../../../constants'
import { sponsorBlockSkipSegments } from '../../helpers/sponsorblock'
import { calculateColorLuminance, colors } from '../../helpers/colors'
import { pathExists } from '../../helpers/filesystem'
import { getPicturesPath, showSaveDialog, showToast } from '../../helpers/utils'

export default Vue.extend({
  name: 'FtVideoPlayer',
  beforeRouteLeave: function () {
    document.removeEventListener('keydown', this.keyboardShortcutHandler)
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

    if (process.env.IS_ELECTRON && this.powerSaveBlocker !== null) {
      const { ipcRenderer } = require('electron')
      ipcRenderer.send(IpcChannels.STOP_POWER_SAVE_BLOCKER, this.powerSaveBlocker)
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
    adaptiveFormats: {
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
    captionHybridList: {
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
    },
    videoId: {
      type: String,
      required: true
    },
    lengthSeconds: {
      type: Number,
      required: true
    },
    chapters: {
      type: Array,
      default: () => { return [] }
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
      selectedResolution: '',
      selectedBitrate: '',
      selectedMimeType: '',
      selectedFPS: 0,
      using60Fps: false,
      maxFramerate: 0,
      activeSourceList: [],
      activeAdaptiveFormats: [],
      mouseTimeout: null,
      touchTimeout: null,
      playerStats: null,
      statsModal: null,
      showStatsModal: false,
      statsModalEventName: 'updateStats',
      usingTouch: false,
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
            'screenshotButton',
            'playbackRateMenuButton',
            'loopButton',
            'chaptersButton',
            'descriptionsButton',
            'subsCapsButton',
            'pictureInPictureToggle',
            'toggleTheatreModeButton',
            'fullWindowButton',
            'qualitySelector',
            'fullscreenToggle'
          ]
        }
      }
    }
  },
  computed: {
    currentLocale: function () {
      return this.$i18n.locale
    },

    defaultPlayback: function () {
      return this.$store.getters.getDefaultPlayback
    },

    defaultSkipInterval: function () {
      return this.$store.getters.getDefaultSkipInterval
    },

    defaultQuality: function () {
      return parseInt(this.$store.getters.getDefaultQuality)
    },

    defaultCaptionSettings: function () {
      try {
        return JSON.parse(this.$store.getters.getDefaultCaptionSettings)
      } catch (e) {
        console.error(e)
        return {}
      }
    },

    defaultVideoFormat: function () {
      return this.$store.getters.getDefaultVideoFormat
    },

    autoplayVideos: function () {
      return this.$store.getters.getAutoplayVideos
    },

    videoVolumeMouseScroll: function () {
      return this.$store.getters.getVideoVolumeMouseScroll
    },

    videoPlaybackRateMouseScroll: function () {
      return this.$store.getters.getVideoPlaybackRateMouseScroll
    },

    videoSkipMouseScroll: function () {
      return this.$store.getters.getVideoSkipMouseScroll
    },

    useSponsorBlock: function () {
      return this.$store.getters.getUseSponsorBlock
    },

    sponsorBlockShowSkippedToast: function () {
      return this.$store.getters.getSponsorBlockShowSkippedToast
    },

    displayVideoPlayButton: function() {
      return this.$store.getters.getDisplayVideoPlayButton
    },

    enterFullscreenOnDisplayRotate: function() {
      return this.$store.getters.getEnterFullscreenOnDisplayRotate
    },

    sponsorSkips: function () {
      const sponsorCats = ['sponsor',
        'selfpromo',
        'interaction',
        'intro',
        'outro',
        'preview',
        'music_offtopic',
        'filler'
      ]
      const autoSkip = {}
      const seekBar = []
      const promptSkip = {}
      const categoryData = {}
      sponsorCats.forEach(x => {
        let sponsorVal = {}
        switch (x) {
          case 'sponsor':
            sponsorVal = this.$store.getters.getSponsorBlockSponsor
            break
          case 'selfpromo':
            sponsorVal = this.$store.getters.getSponsorBlockSelfPromo
            break
          case 'interaction':
            sponsorVal = this.$store.getters.getSponsorBlockInteraction
            break
          case 'intro':
            sponsorVal = this.$store.getters.getSponsorBlockIntro
            break
          case 'outro':
            sponsorVal = this.$store.getters.getSponsorBlockOutro
            break
          case 'preview':
            sponsorVal = this.$store.getters.getSponsorBlockRecap
            break
          case 'music_offtopic':
            sponsorVal = this.$store.getters.getSponsorBlockMusicOffTopic
            break
          case 'filler':
            sponsorVal = this.$store.getters.getSponsorBlockFiller
            break
        }
        if (sponsorVal.skip !== 'doNothing') {
          seekBar.push(x)
        }
        if (sponsorVal.skip === 'autoSkip') {
          autoSkip[x] = true
        }
        if (sponsorVal.skip === 'promptToSkip') {
          promptSkip[x] = true
        }
        categoryData[x] = sponsorVal
      })
      return { autoSkip, seekBar, promptSkip, categoryData }
    },

    maxVideoPlaybackRate: function () {
      return parseInt(this.$store.getters.getMaxVideoPlaybackRate)
    },

    videoPlaybackRateInterval: function () {
      return parseFloat(this.$store.getters.getVideoPlaybackRateInterval)
    },

    playbackRates: function () {
      const playbackRates = []
      let i = this.videoPlaybackRateInterval

      while (i <= this.maxVideoPlaybackRate) {
        playbackRates.push(i)
        i = i + this.videoPlaybackRateInterval
        i = parseFloat(i.toFixed(2))
      }

      return playbackRates
    },

    enableScreenshot: function() {
      return this.$store.getters.getEnableScreenshot
    },

    screenshotFormat: function() {
      return this.$store.getters.getScreenshotFormat
    },

    screenshotQuality: function() {
      return this.$store.getters.getScreenshotQuality
    },

    screenshotAskPath: function() {
      return this.$store.getters.getScreenshotAskPath
    },

    screenshotFolder: function() {
      return this.$store.getters.getScreenshotFolderPath
    }
  },
  watch: {
    showStatsModal: function() {
      this.player.trigger(this.statsModalEventName)
    },

    enableScreenshot: function() {
      this.toggleScreenshotButton()
    }
  },
  mounted: function () {
    const volume = sessionStorage.getItem('volume')

    if (volume !== null) {
      this.volume = volume
    }

    this.dataSetup.playbackRates = this.playbackRates

    this.createFullWindowButton()
    this.createLoopButton()
    this.createToggleTheatreModeButton()
    this.createScreenshotButton()
    this.determineFormatType()
    this.determineMaxFramerate()

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.player.play())
      navigator.mediaSession.setActionHandler('pause', () => this.player.pause())
    }
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

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.playbackState = 'none'
    }

    if (process.env.IS_ELECTRON && this.powerSaveBlocker !== null) {
      const { ipcRenderer } = require('electron')
      ipcRenderer.send(IpcChannels.STOP_POWER_SAVE_BLOCKER, this.powerSaveBlocker)
    }
  },
  methods: {
    initializePlayer: async function () {
      if (typeof this.$refs.video !== 'undefined') {
        if (!this.useDash) {
          qualitySelector(videojs, { showQualitySelectionLabelInControlBar: true })
          await this.determineDefaultQualityLegacy()
        }

        this.player = videojs(this.$refs.video, {
          html5: {
            preloadTextTracks: false,
            vhs: {
              limitRenditionByPlayerDimensions: false,
              smoothQualityChange: false,
              allowSeeksWithinUnsafeLiveWindow: true,
              handlePartialData: true
            }
          }
        })
        this.player.mobileUi({
          fullscreen: {
            enterOnRotate: this.enterFullscreenOnDisplayRotate,
            exitOnRotate: this.enterFullscreenOnDisplayRotate,
            lockOnRotate: false
          },
          // Without this flag, the mobile UI will only activate
          // if videojs detects it is in Android or iOS
          // With this flag, the mobile UI could theoretically
          // work on any device that has a touch input
          forceForTesting: true,
          touchControls: {
            seekSeconds: this.defaultSkipInterval,
            tapTimeout: 300
          }
        })

        this.player.volume(this.volume)
        this.player.playbackRate(this.defaultPlayback)
        this.player.textTrackSettings.setValues(this.defaultCaptionSettings)
        // Remove big play button
        // https://github.com/videojs/video.js/blob/v7.12.1/docs/guides/components.md#basic-example
        if (!this.displayVideoPlayButton) {
          this.player.removeChild('BigPlayButton')
        }

        // Makes the playback rate menu focus the current item on mouse hover
        // or the closest item if the playback rate is between two items
        // which is likely to be the case when the playback rate is changed by scrolling
        const playbackRateMenuButton = this.player.controlBar.getChild('playbackRateMenuButton')
        playbackRateMenuButton.on(playbackRateMenuButton.menuButton_, 'mouseenter', () => {
          const playbackRate = this.player.playbackRate()
          const rates = this.player.playbackRates()

          // iterate through the items in reverse order as the highest is displayed first
          // `slice` must be used as `reverse` does reversing in place
          const targetPlaybackRateMenuItemIndex = rates.slice().reverse().findIndex((rate) => {
            return rate === playbackRate || rate < playbackRate
          })

          // center the selected item in the middle of the visible area
          // the first and last items will never be in the center so it can be skipped for them
          if (targetPlaybackRateMenuItemIndex !== 0 && targetPlaybackRateMenuItemIndex !== rates.length - 1) {
            const playbackRateMenu = playbackRateMenuButton.menu
            const menuElement = playbackRateMenu.contentEl()

            const itemHeight = playbackRateMenu.children()[targetPlaybackRateMenuItemIndex].contentEl().clientHeight

            // clientHeight is the height of the visible part of an element
            const centerOfVisibleArea = (menuElement.clientHeight - itemHeight) / 2
            const menuScrollOffset = (itemHeight * targetPlaybackRateMenuItemIndex) - centerOfVisibleArea

            menuElement.scrollTo({ top: menuScrollOffset })
          }
        })

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

        if (this.autoplayVideos) {
          // Calling play() won't happen right away, so a quick timeout will make it function properly.
          setTimeout(() => {
            this.player.play()
          }, 200)
        }

        // Remove built-in progress bar mouse over current time display
        // `MouseTimeDisplay` in
        // https://github.com/videojs/video.js/blob/v7.13.3/docs/guides/components.md#default-component-tree
        this.player.controlBar.progressControl.seekBar.playProgressBar.removeChild('timeTooltip')

        if (this.chapters.length > 0) {
          this.chapters.forEach(this.addChapterMarker)
        }

        if (this.useSponsorBlock) {
          this.initializeSponsorBlock()
        }

        document.removeEventListener('keydown', this.keyboardShortcutHandler)
        document.addEventListener('keydown', this.keyboardShortcutHandler)

        this.player.on('mousemove', this.hideMouseTimeout)
        this.player.on('mouseleave', this.removeMouseTimeout)

        this.player.on('volumechange', this.updateVolume)
        if (this.videoVolumeMouseScroll) {
          this.player.on('wheel', this.mouseScrollVolume)
        } else {
          this.player.controlBar.getChild('volumePanel').on('wheel', this.mouseScrollVolume)
        }

        if (this.videoPlaybackRateMouseScroll) {
          this.player.on('wheel', this.mouseScrollPlaybackRate)
          // Removes the 'out-of-the-box' click event and adds a custom click event so that a user can
          // ctrl-click (or command+click on a mac) without toggling play/pause
          this.player.el_.firstChild.style.pointerEvents = 'none'
          this.player.on('click', this.handlePlayerClick)
        }
        if (this.videoSkipMouseScroll) {
          this.player.on('wheel', this.mouseScrollSkip)
        }

        this.player.on('fullscreenchange', this.fullscreenOverlay)
        this.player.on('fullscreenchange', this.toggleFullscreenClass)

        this.player.on('ready', () => {
          this.$emit('ready')
          this.checkAspectRatio()
          this.createStatsModal()
          if (this.captionHybridList.length !== 0) {
            this.transformAndInsertCaptions()
          }
          this.toggleScreenshotButton()
        })

        this.player.on('ended', () => {
          this.$emit('ended')

          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none'
          }
        })

        this.player.on('error', (error, message) => {
          this.$emit('error', error.target.player.error_)

          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'none'
          }
        })

        this.player.on('play', async function () {
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing'
          }

          if (process.env.IS_ELECTRON) {
            const { ipcRenderer } = require('electron')
            this.powerSaveBlocker =
              await ipcRenderer.invoke(IpcChannels.START_POWER_SAVE_BLOCKER)
          }
        })

        this.player.on('pause', function () {
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused'
          }

          if (process.env.IS_ELECTRON && this.powerSaveBlocker !== null) {
            const { ipcRenderer } = require('electron')
            ipcRenderer.send(IpcChannels.STOP_POWER_SAVE_BLOCKER, this.powerSaveBlocker)
            this.powerSaveBlocker = null
          }
        })

        this.player.on(this.statsModalEventName, () => {
          if (this.showStatsModal) {
            this.statsModal.open()
            this.player.controls(true)
            this.statsModal.contentEl().innerHTML = this.getFormattedStats()
          } else {
            this.statsModal.close()
          }
        })

        this.player.on('timeupdate', () => {
          if (this.format === 'dash') {
            this.playerStats = this.player.tech({ IWillNotUseThisInPlugins: true }).vhs.stats
            this.updateStatsContent()
          }
          this.$emit('timeupdate')
        })

        this.player.textTrackSettings.on('modalclose', (_) => {
          const settings = this.player.textTrackSettings.getValues()
          this.updateDefaultCaptionSettings(JSON.stringify(settings))
        })

        // right click menu
        if (process.env.IS_ELECTRON) {
          const { ipcRenderer } = require('electron')
          ipcRenderer.removeAllListeners('showVideoStatistics')
          ipcRenderer.on('showVideoStatistics', (event) => {
            this.toggleShowStatsModal()
          })
        }
      }
    },

    initializeSponsorBlock() {
      sponsorBlockSkipSegments(this.videoId, this.sponsorSkips.seekBar)
        .then((skipSegments) => {
          if (skipSegments.length === 0) {
            return
          }

          this.player.ready(() => {
            this.player.on('timeupdate', () => {
              this.skipSponsorBlocks(skipSegments)
            })

            skipSegments.forEach(({
              category,
              segment: [startTime, endTime]
            }) => {
              this.addSponsorBlockMarker({
                time: startTime,
                duration: endTime - startTime,
                color: 'var(--primary-color)',
                category: category
              })
            })
          })
        })
    },

    skipSponsorBlocks(skipSegments) {
      const currentTime = this.player.currentTime()
      const duration = this.player.duration()
      let newTime = null
      let skippedCategory = null
      skipSegments.forEach(({ category, segment: [startTime, endTime] }) => {
        if (startTime <= currentTime && currentTime < endTime) {
          newTime = endTime
          skippedCategory = category
        }
      })
      if (newTime !== null && Math.abs(duration - currentTime) > 0.500) {
        if (this.sponsorSkips.autoSkip[skippedCategory]) {
          if (this.sponsorBlockShowSkippedToast) {
            this.showSkippedSponsorSegmentInformation(skippedCategory)
          }
          this.player.currentTime(newTime)
        }
      }
    },

    showSkippedSponsorSegmentInformation(category) {
      const translatedCategory = this.sponsorBlockTranslatedCategory(category)
      showToast(`${this.$t('Video.Skipped segment')} ${translatedCategory}`)
    },

    sponsorBlockTranslatedCategory(category) {
      switch (category) {
        case 'sponsor':
          return this.$t('Video.Sponsor Block category.sponsor')
        case 'intro':
          return this.$t('Video.Sponsor Block category.intro')
        case 'outro':
          return this.$t('Video.Sponsor Block category.outro')
        case 'selfpromo':
          return this.$t('Video.Sponsor Block category.self-promotion')
        case 'interaction':
          return this.$t('Video.Sponsor Block category.interaction')
        case 'music_offtopic':
          return this.$t('Video.Sponsor Block category.music offtopic')
        case 'filler':
          return this.$t('Video.Sponsor Block category.filler')
        default:
          console.error(`Unknown translation for SponsorBlock category ${category}`)
          return category
      }
    },

    addSponsorBlockMarker(marker) {
      const markerDiv = videojs.dom.createEl('div')

      markerDiv.title = this.sponsorBlockTranslatedCategory(marker.category)
      markerDiv.className = `sponsorBlockMarker main${this.sponsorSkips.categoryData[marker.category].color}`
      markerDiv.style.width = (marker.duration / this.lengthSeconds) * 100 + '%'
      markerDiv.style.marginLeft = (marker.time / this.lengthSeconds) * 100 + '%'

      this.player.el().querySelector('.vjs-progress-holder').appendChild(markerDiv)
    },

    addChapterMarker(chapter) {
      const markerDiv = videojs.dom.createEl('div')

      markerDiv.title = chapter.title
      markerDiv.className = 'chapterMarker'
      markerDiv.style.marginLeft = `calc(${(chapter.startSeconds / this.lengthSeconds) * 100}% - 1px)`

      this.player.el().querySelector('.vjs-progress-holder').appendChild(markerDiv)
    },

    checkAspectRatio() {
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

    updateVolume: function (_event) {
      // 0 means muted
      // https://docs.videojs.com/html5#volume
      const volume = this.player.muted() ? 0 : this.player.volume()
      sessionStorage.setItem('volume', volume)
    },

    mouseScrollVolume: function (event) {
      if (event.target && !event.currentTarget.querySelector('.vjs-menu:hover')) {
        event.preventDefault()

        if (this.player.muted() && event.wheelDelta > 0) {
          this.player.muted(false)
          this.player.volume(0)
        }

        if (!event.ctrlKey && !event.metaKey) {
          if (!this.player.muted()) {
            if (event.wheelDelta > 0) {
              this.changeVolume(0.05)
            } else if (event.wheelDelta < 0) {
              this.changeVolume(-0.05)
            }
          }
        }
      }
    },

    mouseScrollPlaybackRate: function (event) {
      if (event.target && !event.currentTarget.querySelector('.vjs-menu:hover')) {
        event.preventDefault()

        if (event.ctrlKey || event.metaKey) {
          if (event.wheelDelta > 0) {
            this.changePlayBackRate(0.05)
          } else if (event.wheelDelta < 0) {
            this.changePlayBackRate(-0.05)
          }
        }
      }
    },

    mouseScrollSkip: function (event) {
      // Avoid doing both
      if ((event.ctrlKey || event.metaKey) && this.videoPlaybackRateMouseScroll) {
        return
      }

      // ensure that the mouse is over the player
      if (event.target && (event.target.matches('.vjs-tech') || event.target.matches('.ftVideoPlayer'))) {
        event.preventDefault()

        if (event.wheelDelta > 0) {
          this.changeDurationBySeconds(this.defaultSkipInterval * this.player.playbackRate())
        }
        if (event.wheelDelta < 0) {
          this.changeDurationBySeconds(-this.defaultSkipInterval * this.player.playbackRate())
        }
      }
    },

    handlePlayerClick: function (event) {
      if (event.target.matches('.ftVideoPlayer')) {
        if (event.ctrlKey || event.metaKey) {
          this.player.playbackRate(this.defaultPlayback)
        } else {
          if (this.player.paused() || !this.player.hasStarted()) {
            this.player.play()
          } else {
            this.player.pause()
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

    determineMaxFramerate: async function() {
      if (this.dashSrc.length === 0) {
        this.maxFramerate = 60
        return
      }

      try {
        const data = await fs.readFile(this.dashSrc[0].url)

        if (data.includes('frameRate="60"')) {
          this.maxFramerate = 60
        } else {
          this.maxFramerate = 30
        }
      } catch {
        this.maxFramerate = 60
      }
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

      let formatsToTest

      if (typeof this.activeAdaptiveFormats !== 'undefined' && this.activeAdaptiveFormats.length > 0) {
        formatsToTest = this.activeAdaptiveFormats.filter((format) => {
          return format.height === this.defaultQuality
        })

        if (formatsToTest.length === 0) {
          formatsToTest = this.activeAdaptiveFormats.filter((format) => {
            return format.height < this.defaultQuality
          })
        }

        formatsToTest = formatsToTest.sort((a, b) => {
          if (a.height === b.height) {
            return b.bitrate - a.bitrate
          } else {
            return b.height - a.height
          }
        })
      } else {
        formatsToTest = this.player.qualityLevels().levels_.filter((format) => {
          return format.height === this.defaultQuality
        })

        if (formatsToTest.length === 0) {
          formatsToTest = this.player.qualityLevels().levels_.filter((format) => {
            return format.height < this.defaultQuality
          })
        }

        formatsToTest = formatsToTest.sort((a, b) => {
          if (a.height === b.height) {
            return b.bitrate - a.bitrate
          } else {
            return b.height - a.height
          }
        })
      }

      // TODO: Test formats to determine if HDR / 60 FPS and skip them based on
      // User settings
      this.setDashQualityLevel(formatsToTest[0].bitrate)

      // Old logic. Revert if needed
      /* this.player.qualityLevels().levels_.sort((a, b) => {
        if (a.height === b.height) {
          return a.bitrate - b.bitrate
        } else {
          return a.height - b.height
        }
      }).forEach((ql, index, arr) => {
        const height = ql.height
        const width = ql.width
        const quality = width < height ? width : height
        let upperLevel = null

        if (index < arr.length - 1) {
          upperLevel = arr[index + 1]
        }

        if (this.defaultQuality === quality && upperLevel === null) {
          this.setDashQualityLevel(height, true)
        } else if (upperLevel !== null) {
          const upperHeight = upperLevel.height
          const upperWidth = upperLevel.width
          const upperQuality = upperWidth < upperHeight ? upperWidth : upperHeight

          if (this.defaultQuality >= quality && this.defaultQuality === upperQuality) {
            this.setDashQualityLevel(height, true)
          } else if (this.defaultQuality >= quality && this.defaultQuality < upperQuality) {
            this.setDashQualityLevel(height)
          }
        } else if (index === 0 && quality > this.defaultQuality) {
          this.setDashQualityLevel(height)
        } else if (index === (arr.length - 1) && quality < this.defaultQuality) {
          this.setDashQualityLevel(height)
        }
      }) */
    },

    setDashQualityLevel: function (bitrate) {
      let adaptiveFormat = null

      if (bitrate !== 'auto') {
        adaptiveFormat = this.activeAdaptiveFormats.find((format) => {
          return format.bitrate === bitrate
        })
      }

      let qualityLabel = adaptiveFormat ? adaptiveFormat.qualityLabel : ''

      this.player.qualityLevels().levels_.sort((a, b) => {
        if (a.height === b.height) {
          return a.bitrate - b.bitrate
        } else {
          return a.height - b.height
        }
      }).forEach((ql, index, arr) => {
        if (bitrate === 'auto' || bitrate === ql.bitrate) {
          ql.enabled = true
          ql.enabled_(true)
          if (bitrate !== 'auto' && qualityLabel === '') {
            qualityLabel = ql.height + 'p'
          }
        } else {
          ql.enabled = false
          ql.enabled_(false)
        }
      })

      const selectedQuality = bitrate === 'auto' ? 'auto' : qualityLabel

      const qualityElement = document.getElementById('vjs-current-quality')
      qualityElement.innerText = selectedQuality
      this.selectedQuality = selectedQuality

      if (selectedQuality !== 'auto') {
        this.selectedResolution = `${adaptiveFormat.width}x${adaptiveFormat.height}`
        this.selectedFPS = adaptiveFormat.fps
        this.selectedBitrate = adaptiveFormat.bitrate
        this.selectedMimeType = adaptiveFormat.mimeType
      } else {
        this.selectedResolution = 'auto'
        this.selectedFPS = 'auto'
        this.selectedBitrate = 'auto'
        this.selectedMimeType = 'auto'
      }

      const qualityItems = document.querySelectorAll('.quality-item')

      qualityItems.forEach((item) => {
        item.classList.remove('quality-selected')
        const qualityText = item.querySelector('.vjs-menu-item-text')
        if (qualityText.innerText === selectedQuality.toLowerCase()) {
          item.classList.add('quality-selected')
        }
      })

      /* if (this.selectedQuality === qualityLevel && this.using60Fps === is60Fps) {
        return
      }
      let foundSelectedQuality = false
      this.using60Fps = is60Fps
      this.player.qualityLevels().levels_.sort((a, b) => {
        if (a.height === b.height) {
          return a.bitrate - b.bitrate
        } else {
          return a.height - b.height
        }
      }).forEach((ql, index, arr) => {
        if (foundSelectedQuality) {
          ql.enabled = false
          ql.enabled_(false)
        } else if (qualityLevel === 'auto') {
          ql.enabled = true
          ql.enabled_(true)
        } else if (ql.height === qualityLevel) {
          ql.enabled = true
          ql.enabled_(true)
          foundSelectedQuality = true

          let lowerQuality
          let higherQuality

          if ((index - 1) !== -1) {
            lowerQuality = arr[index - 1]
          }

          if ((index + 1) < arr.length) {
            higherQuality = arr[index + 1]
          }

          if (typeof (lowerQuality) !== 'undefined' && lowerQuality.height === ql.height && lowerQuality.bitrate < ql.bitrate && !is60Fps) {
            ql.enabled = false
            ql.enabled_(false)
            foundSelectedQuality = false
          }

          if (typeof (higherQuality) !== 'undefined' && higherQuality.height === ql.height && higherQuality.bitrate > ql.bitrate && is60Fps) {
            ql.enabled = false
            ql.enabled_(false)
            foundSelectedQuality = false
          }
        } else {
          ql.enabled = false
          ql.enabled_(false)
        }
      })

      let selectedQuality = qualityLevel

      if (selectedQuality !== 'auto' && is60Fps) {
        selectedQuality = selectedQuality + 'p60'
      } else if (selectedQuality !== 'auto') {
        selectedQuality = selectedQuality + 'p'
      }

      const qualityElement = document.getElementById('vjs-current-quality')
      qualityElement.innerText = selectedQuality
      this.selectedQuality = qualityLevel

      const qualityItems = $('.quality-item').get()

      $('.quality-item').removeClass('quality-selected')

      qualityItems.forEach((item) => {
        const qualityText = $(item).find('.vjs-menu-item-text').get(0)
        if (qualityText.innerText === selectedQuality) {
          $(item).addClass('quality-selected')
        }
      })

      // const currentTime = this.player.currentTime()

      // this.player.currentTime(0)
      // this.player.currentTime(currentTime) */
    },

    enableDashFormat: function () {
      if (this.dashSrc === null) {
        console.warn('No dash format available.')
        return
      }

      this.useDash = true
      this.useHls = false
      this.activeSourceList = this.dashSrc

      setTimeout(this.initializePlayer, 100)
    },

    enableLegacyFormat: function () {
      if (this.sourceList.length === 0) {
        console.error('No sources available')
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

    changePlayBackRate: function (rate) {
      const newPlaybackRate = (this.player.playbackRate() + rate).toFixed(2)

      if (newPlaybackRate >= this.videoPlaybackRateInterval && newPlaybackRate <= this.maxVideoPlaybackRate) {
        this.player.playbackRate(newPlaybackRate)
      }
    },

    framebyframe: function (step) {
      this.player.pause()
      const quality = this.useDash ? this.player.qualityLevels()[this.player.qualityLevels().selectedIndex] : {}
      let fps = 30
      // Non-Dash formats are 30fps only
      if (this.maxFramerate === 60 && quality.height >= 480) {
        for (let i = 0; i < this.adaptiveFormats.length; i++) {
          if (this.adaptiveFormats[i].bitrate === quality.bitrate) {
            fps = this.adaptiveFormats[i].fps ? this.adaptiveFormats[i].fps : 30
            break
          }
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
      const VjsButton = videojs.getComponent('Button')
      const loopButton = videojs.extend(VjsButton, {
        constructor: function(player, options) {
          VjsButton.call(this, player, options)
        },
        handleClick: () => {
          this.toggleVideoLoop()
        },
        createControlTextEl: function (button) {
          button.title = 'Toggle Loop'

          const div = document.createElement('div')

          div.id = 'loopButton'
          div.className = 'vjs-icon-loop loop-white vjs-button loopWhite'

          button.appendChild(div)

          return div
        }
      })
      videojs.registerComponent('loopButton', loopButton)
    },

    toggleVideoLoop: function () {
      const loopButton = document.getElementById('loopButton')

      if (!this.player.loop()) {
        const currentTheme = this.$store.state.settings.mainColor

        const colorValue = colors.find(color => color.name === currentTheme).value

        const themeTextColor = calculateColorLuminance(colorValue)

        loopButton.classList.add('vjs-icon-loop-active')

        if (themeTextColor === '#000000') {
          loopButton.classList.add('loop-black')
          loopButton.classList.remove('loop-white')
        }

        this.player.loop(true)
      } else {
        loopButton.classList.remove('vjs-icon-loop-active')
        loopButton.classList.remove('loop-black')
        loopButton.classList.add('loop-white')
        this.player.loop(false)
      }
    },

    createFullWindowButton: function () {
      const VjsButton = videojs.getComponent('Button')
      const fullWindowButton = videojs.extend(VjsButton, {
        constructor: function(player, options) {
          VjsButton.call(this, player, options)
        },
        handleClick: () => {
          this.toggleFullWindow()
        },
        createControlTextEl: function (button) {
          // Add class name to button to be able to target it with CSS selector
          button.classList.add('vjs-button-fullwindow')
          button.title = 'Full Window'

          const div = document.createElement('div')
          div.id = 'fullwindow'
          div.className = 'vjs-icon-fullwindow-enter vjs-button'

          button.appendChild(div)

          return div
        }
      })
      videojs.registerComponent('fullWindowButton', fullWindowButton)
    },

    createToggleTheatreModeButton: function() {
      if (!this.$parent.theatrePossible) {
        return
      }

      const theatreModeActive = this.$parent.useTheatreMode ? ' vjs-icon-theatre-active' : ''

      const VjsButton = videojs.getComponent('Button')
      const toggleTheatreModeButton = videojs.extend(VjsButton, {
        constructor: function(player, options) {
          VjsButton.call(this, player, options)
        },
        handleClick: () => {
          this.toggleTheatreMode()
        },
        createControlTextEl: function (button) {
          button.classList.add('vjs-button-theatre')
          button.title = 'Toggle Theatre Mode'

          const div = document.createElement('div')
          div.id = 'toggleTheatreModeButton'
          div.className = `vjs-icon-theatre-inactive${theatreModeActive} vjs-button`

          button.appendChild(div)

          return button
        }
      })

      videojs.registerComponent('toggleTheatreModeButton', toggleTheatreModeButton)
    },

    toggleTheatreMode: function() {
      if (!this.player.isFullscreen_) {
        const toggleTheatreModeButton = document.getElementById('toggleTheatreModeButton')
        if (!this.$parent.useTheatreMode) {
          toggleTheatreModeButton.classList.add('vjs-icon-theatre-active')
        } else {
          toggleTheatreModeButton.classList.remove('vjs-icon-theatre-active')
        }
      }

      this.$parent.toggleTheatreMode()
    },

    createScreenshotButton: function() {
      const VjsButton = videojs.getComponent('Button')
      const screenshotButton = videojs.extend(VjsButton, {
        constructor: function(player, options) {
          VjsButton.call(this, player, options)
        },
        handleClick: () => {
          this.takeScreenshot()
          const video = document.getElementsByTagName('video')[0]
          video.focus()
          video.blur()
        },
        createControlTextEl: function (button) {
          button.classList.add('vjs-hidden')
          button.title = 'Screenshot'

          const div = document.createElement('div')
          div.id = 'screenshotButton'
          div.className = 'vjs-icon-screenshot vjs-button'

          button.appendChild(div)

          return div
        }
      })

      videojs.registerComponent('screenshotButton', screenshotButton)
    },

    toggleScreenshotButton: function() {
      const button = document.getElementById('screenshotButton').parentNode
      if (this.enableScreenshot && this.format !== 'audio') {
        button.classList.remove('vjs-hidden')
      } else {
        button.classList.add('vjs-hidden')
      }
    },

    takeScreenshot: async function() {
      if (!this.enableScreenshot || this.format === 'audio') {
        return
      }

      const width = this.player.videoWidth()
      const height = this.player.videoHeight()
      if (width <= 0) {
        return
      }

      // Need to set crossorigin="anonymous" for LegacyFormat on Invidious
      // https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
      const video = document.querySelector('video')
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(video, 0, 0)

      const format = this.screenshotFormat
      const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`
      const imageQuality = format === 'jpg' ? this.screenshotQuality / 100 : 1

      let filename
      try {
        filename = await this.parseScreenshotCustomFileName({
          date: new Date(Date.now()),
          playerTime: this.player.currentTime(),
          videoId: this.videoId
        })
      } catch (err) {
        console.error(`Parse failed: ${err.message}`)
        showToast(this.$t('Screenshot Error', { error: err.message }))
        canvas.remove()
        return
      }

      let subDir = ''
      if (filename.indexOf(path.sep) !== -1) {
        const lastIndex = filename.lastIndexOf(path.sep)
        subDir = filename.substring(0, lastIndex)
        filename = filename.substring(lastIndex + 1)
      }
      const filenameWithExtension = `${filename}.${format}`

      let dirPath
      let filePath
      if (this.screenshotAskPath) {
        const wasPlaying = !this.player.paused()
        if (wasPlaying) {
          this.player.pause()
        }

        if (this.screenshotFolder === '' || !(await pathExists(this.screenshotFolder))) {
          dirPath = await getPicturesPath()
        } else {
          dirPath = this.screenshotFolder
        }

        const options = {
          defaultPath: path.join(dirPath, filenameWithExtension),
          filters: [
            {
              name: format.toUpperCase(),
              extensions: [format]
            }
          ]
        }

        const response = await showSaveDialog(options)
        if (wasPlaying) {
          this.player.play()
        }
        if (response.canceled || response.filePath === '') {
          canvas.remove()
          return
        }

        filePath = response.filePath
        if (!filePath.endsWith(`.${format}`)) {
          filePath = `${filePath}.${format}`
        }

        dirPath = path.dirname(filePath)
        this.updateScreenshotFolderPath(dirPath)
      } else {
        if (this.screenshotFolder === '') {
          dirPath = path.join(await getPicturesPath(), 'Freetube', subDir)
        } else {
          dirPath = path.join(this.screenshotFolder, subDir)
        }

        if (!(await pathExists(dirPath))) {
          try {
            fs.mkdir(dirPath, { recursive: true })
          } catch (err) {
            console.error(err)
            showToast(this.$t('Screenshot Error', { error: err }))
            canvas.remove()
            return
          }
        }
        filePath = path.join(dirPath, filenameWithExtension)
      }

      canvas.toBlob((result) => {
        result.arrayBuffer().then(ab => {
          const arr = new Uint8Array(ab)

          fs.writeFile(filePath, arr)
            .then(() => {
              showToast(this.$t('Screenshot Success', { filePath }))
            })
            .catch((err) => {
              console.error(err)
              showToast(this.$t('Screenshot Error', { error: err }))
            })
        })
      }, mimeType, imageQuality)
      canvas.remove()
    },

    createDashQualitySelector: function (levels) {
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
        handleClick: (event) => {
          const selectedQuality = event.target.innerText
          const bitrate = selectedQuality === 'auto' ? 'auto' : parseInt(event.target.attributes.bitrate.value)
          this.setDashQualityLevel(bitrate)
        },
        createControlTextEl: (button) => {
          const beginningHtml = `<div class="vjs-quality-level-value">
           <span id="vjs-current-quality">1080p</span>
          </div>
          <div class="vjs-quality-level-menu vjs-menu">
             <ul class="vjs-menu-content" role="menu">`
          const endingHtml = '</ul></div>'

          let qualityHtml = `<li class="vjs-menu-item quality-item" role="menuitemradio" tabindex="-1" aria-checked="false" aria-disabled="false">
            <span class="vjs-menu-item-text">Auto</span>
            <span class="vjs-control-text" aria-live="polite"></span>
          </li>`

          levels.levels_.sort((a, b) => {
            if (b.height === a.height) {
              return b.bitrate - a.bitrate
            } else {
              return b.height - a.height
            }
          }).forEach((quality, index, array) => {
            let fps
            let qualityLabel
            let bitrate

            if (typeof this.adaptiveFormats !== 'undefined' && this.adaptiveFormats.length > 0) {
              const adaptiveFormat = this.adaptiveFormats.find((format) => {
                return format.bitrate === quality.bitrate
              })

              if (typeof adaptiveFormat === 'undefined') {
                return
              }

              this.activeAdaptiveFormats.push(adaptiveFormat)

              fps = adaptiveFormat.fps ? adaptiveFormat.fps : 30
              qualityLabel = adaptiveFormat.qualityLabel ? adaptiveFormat.qualityLabel : quality.height + 'p'
              bitrate = quality.bitrate
            } else {
              fps = 30
              qualityLabel = quality.height + 'p'
              bitrate = quality.bitrate
            }

            qualityHtml += `<li class="vjs-menu-item quality-item" role="menuitemradio" tabindex="-1" aria-checked="false" aria-disabled="false" fps="${fps}" bitrate="${bitrate}">
              <span class="vjs-menu-item-text" fps="${fps}" bitrate="${bitrate}">${qualityLabel}</span>
              <span class="vjs-control-text" aria-live="polite"></span>
            </li>`

            // Old logic, revert if needed.
            /* let is60Fps = false
            if (index < array.length - 1 && array[index + 1].height === quality.height) {
              if (array[index + 1].bitrate < quality.bitrate) {
                is60Fps = true
              }
            }
            const qualityText = is60Fps ? quality.height + 'p60' : quality.height + 'p'
            qualityHtml = qualityHtml + `<li class="vjs-menu-item quality-item" role="menuitemradio" tabindex="-1" aria-checked="false aria-disabled="false">
              <span class="vjs-menu-item-text">${qualityText}</span>
              <span class="vjs-control-text" aria-live="polite"></span>
            </li>` */
          })
          // the default width is 3em which is too narrow for qualitly labels with fps e.g. 1080p60
          button.style.width = '4em'
          button.title = 'Select Quality'
          button.innerHTML = beginningHtml + qualityHtml + endingHtml

          return button.children[0]
        }
      })
      videojs.registerComponent('dashQualitySelector', dashQualitySelector)
      this.player.controlBar.addChild('dashQualitySelector', {}, this.player.controlBar.children_.length - 1)
      this.determineDefaultQualityDash()
    },

    sortCaptions: function (captionList) {
      return captionList.sort((captionA, captionB) => {
        const aCode = captionA.languageCode.split('-') // ex. [en,US]
        const bCode = captionB.languageCode.split('-')
        const aName = (captionA.label || captionA.name.simpleText) // ex: english (auto-generated)
        const bName = (captionB.label || captionB.name.simpleText)
        const userLocale = this.currentLocale.split(/-|_/) // ex. [en,US]
        if (aCode[0] === userLocale[0]) { // caption a has same language as user's locale
          if (bCode[0] === userLocale[0]) { // caption b has same language as user's locale
            if (bName.search('auto') !== -1) {
              // prefer caption a: b is auto-generated captions
              return -1
            } else if (aName.search('auto') !== -1) {
              // prefer caption b: a is auto-generated captions
              return 1
            } else if (aCode[1] === userLocale[1]) {
              // prefer caption a: caption a has same county code as user's locale
              return -1
            } else if (bCode[1] === userLocale[1]) {
              // prefer caption b: caption b has same county code as user's locale
              return 1
            } else if (aCode[1] === undefined) {
              // prefer caption a: no country code is better than wrong country code
              return -1
            } else if (bCode[1] === undefined) {
              // prefer caption b: no country code is better than wrong country code
              return 1
            }
          } else {
            // prefer caption a: b does not match user's language
            return -1
          }
        } else if (bCode[0] === userLocale[0]) {
          // prefer caption b: a does not match user's language
          return 1
        }
        // sort alphabetically
        return aName.localeCompare(bName)
      })
    },

    transformAndInsertCaptions: async function() {
      let captionList
      if (this.captionHybridList[0] instanceof Promise) {
        captionList = await Promise.all(this.captionHybridList)
        this.$emit('store-caption-list', captionList)
      } else {
        captionList = this.captionHybridList
      }

      for (const caption of this.sortCaptions(captionList)) {
        this.player.addRemoteTextTrack({
          kind: 'subtitles',
          src: caption.baseUrl || caption.url,
          srclang: caption.languageCode,
          label: caption.label || caption.name.simpleText,
          type: caption.type
        }, true)
      }
    },

    toggleFullWindow: function() {
      if (!this.player.isFullscreen_) {
        if (this.player.isFullWindow) {
          this.player.removeClass('vjs-full-screen')
          this.player.isFullWindow = false
          document.documentElement.style.overflow = this.player.docOrigOverflow
          document.body.classList.remove('vjs-full-window')
          document.getElementById('fullwindow').classList.remove('vjs-icon-fullwindow-exit')
          this.player.trigger('exitFullWindow')
        } else {
          this.player.addClass('vjs-full-screen')
          this.player.isFullscreen_ = false
          this.player.isFullWindow = true
          this.player.docOrigOverflow = document.documentElement.style.overflow
          document.documentElement.style.overflow = 'hidden'
          document.body.classList.add('vjs-full-window')
          document.getElementById('fullwindow').classList.add('vjs-icon-fullwindow-exit')
          this.player.trigger('enterFullWindow')
        }
      }
    },

    exitFullWindow: function() {
      if (this.player.isFullWindow) {
        this.player.isFullWindow = false
        document.documentElement.style.overflow = this.player.docOrigOverflow
        this.player.removeClass('vjs-full-screen')
        document.body.classList.remove('vjs-full-window')
        document.getElementById('fullwindow').classList.remove('vjs-icon-fullwindow-exit')
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
      if (typeof this.$refs.video !== 'undefined') {
        this.$refs.video.style.cursor = 'default'
        clearTimeout(this.mouseTimeout)
        this.mouseTimeout = setTimeout(() => {
          this.$refs.video.style.cursor = 'none'
        }, 2650)
      }
    },

    removeMouseTimeout: function () {
      if (this.mouseTimeout !== null) {
        clearTimeout(this.mouseTimeout)
      }
    },

    fullscreenOverlay: function () {
      const title = document.title.replace('- FreeTube', '')

      if (this.player.isFullscreen()) {
        this.player.ready(() => {
          this.player.overlay({
            overlays: [{
              showBackground: false,
              content: title,
              start: 'mousemove',
              end: 'userinactive'
            }]
          })
        })
      } else {
        this.player.ready(() => {
          this.player.overlay({
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

    toggleFullscreenClass: function () {
      if (this.player.isFullscreen()) {
        document.body.classList.add('vjs--full-screen-enabled')
      } else {
        document.body.classList.remove('vjs--full-screen-enabled')
      }
    },

    handleTouchStart: function () {
      this.usingTouch = true
    },

    handleMouseOver: function () {
      // This addresses a discrepancy that only seems to occur in the mobile version of firefox
      if (navigator.userAgent.search('Firefox') !== -1 && (videojs.browser.IS_ANDROID || videojs.browser.IS_IOS)) { return }
      this.usingTouch = false
    },

    toggleShowStatsModal: function() {
      if (this.format !== 'dash') {
        showToast(this.$t('Video.Stats.Video statistics are not available for legacy videos'))
      } else {
        this.showStatsModal = !this.showStatsModal
      }
    },
    createStatsModal: function() {
      const ModalDialog = videojs.getComponent('ModalDialog')
      this.statsModal = new ModalDialog(this.player, {
        temporary: false,
        pauseOnOpen: false
      })
      this.statsModal.handleKeyDown_ = (event) => {
        // the default handler prevents keyboard events propagating beyond the modal
        // the modal should only handle the escape and tab key, all others should be handled by the player
        if (event.key === 'Escape' || event.key === 'Tab') {
          this.statsModal.handleKeyDown(event)
        }
      }
      this.player.addChild(this.statsModal)
      this.statsModal.el_.classList.add('statsModal')
      this.statsModal.on('modalclose', () => {
        this.showStatsModal = false
      })
    },
    updateStatsContent: function() {
      if (this.showStatsModal) {
        this.statsModal.contentEl().innerHTML = this.getFormattedStats()
      }
    },
    getFormattedStats: function() {
      const currentVolume = this.player.muted() ? 0 : this.player.volume()
      const volume = `${(currentVolume * 100).toFixed(0)}%`
      const bandwidth = `${(this.playerStats.bandwidth / 1000).toFixed(2)}kbps`
      const buffered = `${(this.player.bufferedPercent() * 100).toFixed(0)}%`
      const droppedFrames = this.playerStats.videoPlaybackQuality.droppedVideoFrames
      const totalFrames = this.playerStats.videoPlaybackQuality.totalVideoFrames
      const frames = `${droppedFrames} / ${totalFrames}`
      const resolution = this.selectedResolution === 'auto' ? 'auto' : `${this.selectedResolution}@${this.selectedFPS}fps`
      const playerDimensions = `${this.playerStats.playerDimensions.width}x${this.playerStats.playerDimensions.height}`
      const statsArray = [
        [this.$t('Video.Stats.Video ID'), this.videoId],
        [this.$t('Video.Stats.Resolution'), resolution],
        [this.$t('Video.Stats.Player Dimensions'), playerDimensions],
        [this.$t('Video.Stats.Bitrate'), this.selectedBitrate],
        [this.$t('Video.Stats.Volume'), volume],
        [this.$t('Video.Stats.Bandwidth'), bandwidth],
        [this.$t('Video.Stats.Buffered'), buffered],
        [this.$t('Video.Stats.Dropped / Total Frames'), frames],
        [this.$t('Video.Stats.Mimetype'), this.selectedMimeType]
      ]
      let listContentHTML = ''

      statsArray.forEach((stat) => {
        const content = `<p>${stat[0]}: ${stat[1]}</p>`
        listContentHTML += content
      })
      return listContentHTML
    },

    /**
     * determines whether the jump to the previous or next chapter
     * with the the keyboard shortcuts, should be done
     * first it checks whether there are any chapters (the array is also empty if chapters are hidden)
     * it also checks that the approprate combination was used ALT/OPTION on macOS and CTRL everywhere else
     * @param {KeyboardEvent} event the keyboard event
     * @param {string} direction the direction of the jump either previous or next
     * @returns {boolean}
     */
    canChapterJump: function (event, direction) {
      const currentChapter = this.$parent.videoCurrentChapterIndex
      return this.chapters.length > 0 &&
        (direction === 'previous' ? currentChapter > 0 : this.chapters.length - 1 !== currentChapter) &&
        ((process.platform !== 'darwin' && event.ctrlKey) ||
          (process.platform === 'darwin' && event.metaKey))
    },

    // This function should always be at the bottom of this file
    keyboardShortcutHandler: function (event) {
      if (document.activeElement.classList.contains('ft-input')) {
        return
      }

      // allow chapter jump keyboard shortcuts
      if (event.ctrlKey && (process.platform === 'darwin' || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight'))) {
        return
      }

      // allow copying text
      if ((event.ctrlKey || event.metaKey) && event.key.lowercase() === 'c') {
        return
      }

      if (this.player !== null) {
        switch (event.key) {
          case ' ':
          case 'Spacebar': // older browsers might return spacebar instead of a space character
            // Toggle Play/Pause
            event.preventDefault()
            this.togglePlayPause()
            break
          case 'J':
          case 'j':
            // Rewind by 2x the time-skip interval (in seconds)
            event.preventDefault()
            this.changeDurationBySeconds(-this.defaultSkipInterval * this.player.playbackRate() * 2)
            break
          case 'K':
          case 'k':
            // Toggle Play/Pause
            event.preventDefault()
            this.togglePlayPause()
            break
          case 'L':
          case 'l':
            // Fast-Forward by 2x the time-skip interval (in seconds)
            event.preventDefault()
            this.changeDurationBySeconds(this.defaultSkipInterval * this.player.playbackRate() * 2)
            break
          case 'O':
          case 'o':
            // Decrease playback rate by 0.25x
            event.preventDefault()
            this.changePlayBackRate(-this.videoPlaybackRateInterval)
            break
          case 'P':
          case 'p':
            // Increase playback rate by 0.25x
            event.preventDefault()
            this.changePlayBackRate(this.videoPlaybackRateInterval)
            break
          case 'F':
          case 'f':
            // Toggle Fullscreen Playback
            event.preventDefault()
            this.toggleFullscreen()
            break
          case 'M':
          case 'm':
            // Toggle Mute
            if (!event.metaKey) {
              event.preventDefault()
              this.toggleMute()
            }
            break
          case 'C':
          case 'c':
            // Toggle Captions
            event.preventDefault()
            this.toggleCaptions()
            break
          case 'ArrowUp':
            // Increase volume
            event.preventDefault()
            this.changeVolume(0.05)
            break
          case 'ArrowDown':
            // Decrease Volume
            event.preventDefault()
            this.changeVolume(-0.05)
            break
          case 'ArrowLeft':
            event.preventDefault()
            if (this.canChapterJump(event, 'previous')) {
              // Jump to the previous chapter
              this.player.currentTime(this.chapters[this.$parent.videoCurrentChapterIndex - 1].startSeconds)
            } else {
              // Rewind by the time-skip interval (in seconds)
              this.changeDurationBySeconds(-this.defaultSkipInterval * this.player.playbackRate())
            }
            break
          case 'ArrowRight':
            event.preventDefault()
            if (this.canChapterJump(event, 'next')) {
              // Jump to the next chapter
              this.player.currentTime(this.chapters[this.$parent.videoCurrentChapterIndex + 1].startSeconds)
            } else {
              // Fast-Forward by the time-skip interval (in seconds)
              this.changeDurationBySeconds(this.defaultSkipInterval * this.player.playbackRate())
            }
            break
          case 'I':
          case 'i':
            event.preventDefault()
            // Toggle Picture in Picture Mode
            if (this.format !== 'audio' && !this.player.isInPictureInPicture()) {
              this.player.requestPictureInPicture()
            } else if (this.player.isInPictureInPicture()) {
              this.player.exitPictureInPicture()
            }
            break
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9': {
            // Jump to percentage in the video
            event.preventDefault()

            const percentage = parseInt(event.key) / 10
            const duration = this.player.duration()
            const newTime = duration * percentage

            this.player.currentTime(newTime)
            break
          }
          case ',':
            // Return to previous frame
            this.framebyframe(-1)
            break
          case '.':
            // Advance to next frame
            this.framebyframe(1)
            break
          case 'D':
          case 'd':
            event.preventDefault()
            this.toggleShowStatsModal()
            break
          case 'Escape':
            // Exit full window
            event.preventDefault()
            this.exitFullWindow()
            break
          case 'S':
          case 's':
            // Toggle Full Window Mode
            this.toggleFullWindow()
            break
          case 'T':
          case 't':
            // Toggle Theatre Mode
            this.toggleTheatreMode()
            break
          case 'U':
          case 'u':
            // Take screenshot
            this.takeScreenshot()
            break
        }
      }
    },

    ...mapActions([
      'updateDefaultCaptionSettings',
      'parseScreenshotCustomFileName',
      'updateScreenshotFolderPath',
    ])
  }
})
