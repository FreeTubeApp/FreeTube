import fs from 'fs/promises'
import path from 'path'

import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import shaka from 'shaka-player'
import 'shaka-player/dist/controls.css'

import { IpcChannels } from '../../../constants'
import { FullWindowButton } from './player-components/FullWindowButton'
import { LegacyQualitySelection } from './player-components/LegacyQualitySelection'
import { ScreenshotButton } from './player-components/ScreenshotButton'
import { StatsButton } from './player-components/StatsButton'
import { TheatreModeButton } from './player-components/TheatreModeButton'
import { shakaCueFromVTTCue } from '../../helpers/player/legacyFormatsVttCueParser'
import {
  getSponsorBlockSegments,
  logShakaError,
  qualityLabelToDimension,
  sortCaptions,
  translateSponsorBlockCategory
} from '../../helpers/player/utils'
import {
  getPicturesPath,
  showSaveDialog,
  showToast
} from '../../helpers/utils'
import { pathExists } from '../../helpers/filesystem'

/** @typedef {import('../../helpers/sponsorblock').SponsorBlockCategory} SponsorBlockCategory */

// The UTF-8 characters "h", "t", "t", and "p".
const HTTP_IN_HEX = 0x68747470

const USE_OVERFLOW_MENU_WIDTH_THRESHOLD = 600

const RequestType = shaka.net.NetworkingEngine.RequestType
const TrackLabelFormat = shaka.ui.Overlay.TrackLabelFormat

/** @type {Map<string, string>} */
const LOCALE_MAPPINGS = new Map(process.env.SHAKA_LOCALE_MAPPINGS)

export default defineComponent({
  name: 'FtShakaVideoPlayer',
  props: {
    format: {
      type: String,
      required: true
    },
    manifestSrc: {
      type: String,
      required: true
    },
    manifestMimeType: {
      type: String,
      required: true
    },
    legacyFormats: {
      type: Array,
      default: () => ([])
    },
    startTime: {
      type: Number,
      default: null
    },
    captions: {
      type: Array,
      default: () => ([])
    },
    chapters: {
      type: Array,
      default: () => ([])
    },
    currentChapterIndex: {
      type: Number,
      default: 0
    },
    storyboardSrc: {
      type: String,
      default: ''
    },
    videoId: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    thumbnail: {
      type: String,
      default: ''
    },
    theatrePossible: {
      type: Boolean,
      default: false
    },
    useTheatreMode: {
      type: Boolean,
      default: false
    },
    vrProjection: {
      type: String,
      default: null
    }
  },
  emits: [
    'error',
    'loaded',
    'ended',
    'timeupdate',
    'toggle-theatre-mode'
  ],
  setup: function () {
    /**
     * Vue's reactivity breaks shaka-player.
     * https://github.com/shaka-project/shaka-player/blob/main/docs/tutorials/faq.md?plain=1#L226-L234
     *
     * As we need to be able to set these variables from outside this function, we need to wrap them in an object,
     * once we switch to Vue 3 and everything in this component can be moved into the setup function, we can remove the wrapper
     */
    const nonReactive = {
      /** @type {shaka.Player|null} */
      player: null,
      /** @type {shaka.ui.Overlay|null} */
      ui: null
    }

    // region legacy text displayer

    /** @type {shaka.text.UITextDisplayer|null} */
    let legacyTextDisplayer = null

    /** @type {shaka.util.EventManager|null} */
    let legacyTextEventManager = null

    /**
     * For the legacy formats the captions are handled by the browser instead of shaka.
     * As we want to maintain the same appearance and functionality across all 3 formats (audio, dash and legacy),
     * this function sets up and configures a custom `shaka.text.UITextDisplayer` instance,
     * it also sets up event handlers to add and remove cues, when the browser reports that the active ones changed.
     * The browser's own caption display is hidden through CSS.
     *
     * @param {HTMLVideoElement} video
     * @param {HTMLElement} container
     */
    async function setUpLegacyTextDisplay(video, container) {
      await cleanUpLegacyTextDisplay()

      const player = nonReactive.player

      const textDisplayerConfig = player.getConfiguration().textDisplayer

      legacyTextDisplayer = new shaka.text.UITextDisplayer(video, container, textDisplayerConfig)

      // using an event manager lets us easily release the event handlers in one go, when we tear down the legacy text display
      legacyTextEventManager = new shaka.util.EventManager()

      legacyTextEventManager.listen(player, 'texttrackvisibility', () => {
        legacyTextDisplayer.setTextVisibility(player.isTextTrackVisible())
      })

      /** @type {TextTrack} */
      let currentTrack

      legacyTextEventManager.listen(player, 'textchanged', () => {
        const { start, end } = player.seekRange()
        legacyTextDisplayer.remove(start, end)

        legacyTextEventManager.unlisten(currentTrack, 'cuechange')

        // TextTracksList doesn't support forEach or for-of
        for (let i = 0; i < video.textTracks.length; i++) {
          const textTrack = video.textTracks[i]

          if (textTrack.mode === 'showing') {
            currentTrack = textTrack
            break
          }
        }

        // TODO: performance improvement, don't listen to cue changes while the captions are hidden
        legacyTextEventManager.listen(currentTrack, 'cuechange', () => {
          // As live streams don't support legacy formats and the duration of VOD videos doesn't changes,
          // we can assume that the seek range will always be the same, so we don't have to read it out here again
          legacyTextDisplayer.remove(start, end)
          if (currentTrack.activeCues) {
            const activeCues = Array.from(currentTrack.activeCues).map(shakaCueFromVTTCue)
            legacyTextDisplayer.append(activeCues)
          }
        })

        // add current ones now, so that they show straight away, not just when the next event fires
        // e.g. when the video is paused
        if (currentTrack.activeCues) {
          const activeCues = Array.from(currentTrack.activeCues).map(shakaCueFromVTTCue)
          legacyTextDisplayer.append(activeCues)
        }
      })
    }

    /**
     * Tears down the legacy captions text displayer and removes the event listeners
     */
    async function cleanUpLegacyTextDisplay() {
      if (legacyTextEventManager) {
        // store in a temporary variable, so we can clear the variable immediately, even if the release takes longer
        const eventManager = legacyTextEventManager
        legacyTextEventManager = null

        eventManager.release()
      }

      if (legacyTextDisplayer) {
        // store in a temporary variable, so we can clear the variable immediately, even if the destroy takes longer
        const textDisplayer = legacyTextDisplayer
        legacyTextDisplayer = null

        await textDisplayer.destroy()
      }
    }

    // endregion legacy text displayer

    return {
      nonReactive,

      setUpLegacyTextDisplay,
      cleanUpLegacyTextDisplay
    }
  },
  data: function () {
    /**
     * @type {{
     *   url: string,
     *   label: string,
     *   language: string,
     *   mimeType: string,
     *   isAutotranslated?: boolean
     * }[]}
     */
    let sortedCaptions

    // we don't need to sort if we only have one caption or don't have any
    if (this.captions.length > 1) {
      // theoretically we would resort when the language changes, but we can't remove captions that we already added to the player
      sortedCaptions = sortCaptions(this.captions)
    } else if (this.captions.length === 1) {
      sortedCaptions = this.captions
    } else {
      sortedCaptions = []
    }

    return {
      // shaka-player ships with some locales prebundled and already loaded
      loadedLocales: new Set(process.env.SHAKA_LOCALES_PREBUNDLED),

      powerSaveBlocker: null,

      hasLoaded: false,

      hasMultipleAudioTracks: false,
      hasMultipleAudioChannelCounts: false,
      isLive: false,

      activeLegacyFormat: null,

      sortedCaptions,
      /** @type {number|null} */
      restoreCaptionIndex: null,

      events: new EventTarget(),

      fullWindowEnabled: false,

      forceAspectRatio: false,

      useOverFlowMenu: false,
      /** @type {ResizeObserver} */
      resizeObserver: null,

      /** @type {{
       *   uuid: string
       *   category: SponsorBlockCategory
       *   startTime: number,
       *   endTime: number
       * }[]} */
      sponsorBlockSegments: [],

      /**
       * Yes a map would be much more suitable for this (unlike objects they retain the order that items were inserted),
       * but Vue 2 doesn't support reactivity on Maps, so we have to use an array instead
       * @type {{uuid: string, translatedCategory: string, timeoutId: number}[]}
       */
      skippedSponsorBlockSegments: [],

      showStats: false,
      stats: {
        resolution: {
          width: 0,
          height: 0,
          frameRate: 0
        },
        playerDimensions: {
          width: 0,
          height: 0
        },
        bitrate: 0,
        volume: 100,
        bandwidth: 0,
        buffered: 0,
        frames: {
          totalFrames: 0,
          droppedFrames: 0
        },
        codecs: {
          audioItag: '',
          audioCodec: '',
          videoItag: '',
          videoCodec: ''
        }
      }
    }
  },
  computed: {
    autoplayVideos: function () {
      return this.$store.getters.getAutoplayVideos
    },

    displayVideoPlayButton: function () {
      return this.$store.getters.getDisplayVideoPlayButton
    },

    defaultPlayback: function () {
      return this.$store.getters.getDefaultPlayback
    },

    defaultSkipInterval: function () {
      return this.$store.getters.getDefaultSkipInterval
    },

    /**
     * @returns {number|'auto'}
     */
    defaultQuality: function () {
      const value = this.$store.getters.getDefaultQuality
      if (value === 'auto') { return value }

      return parseInt(value)
    },

    enableSubtitlesByDefault: function () {
      return this.$store.getters.getEnableSubtitlesByDefault
    },

    enterFullscreenOnDisplayRotate: function () {
      return this.$store.getters.getEnterFullscreenOnDisplayRotate
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
        playbackRates.unshift(i)
        i += this.videoPlaybackRateInterval
        i = parseFloat(i.toFixed(2))
      }

      return playbackRates
    },

    enableScreenshot: function () {
      return this.$store.getters.getEnableScreenshot
    },

    screenshotFormat: function () {
      return this.$store.getters.getScreenshotFormat
    },

    screenshotQuality: function () {
      return this.$store.getters.getScreenshotQuality
    },

    screenshotAskPath: function () {
      return this.$store.getters.getScreenshotAskPath
    },

    screenshotFolder: function () {
      return this.$store.getters.getScreenshotFolderPath
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

    locale: function () {
      return this.$i18n.locale
    },

    useSponsorBlock: function () {
      return this.$store.getters.getUseSponsorBlock
    },

    sponsorBlockShowSkippedToast: function () {
      return this.$store.getters.getSponsorBlockShowSkippedToast
    },

    sponsorSkips: function () {
      // save some work when sponsorblock is disabled
      if (!this.useSponsorBlock) {
        return {}
      }

      /** @type {SponsorBlockCategory[]} */
      const sponsorCategories = ['sponsor',
        'selfpromo',
        'interaction',
        'intro',
        'outro',
        'preview',
        'music_offtopic',
        'filler'
      ]

      /** @type {Set<SponsorBlockCategory>} */
      const autoSkip = new Set()

      /** @type {SponsorBlockCategory[]} */
      const seekBar = []

      /** @type {Set<SponsorBlockCategory>} */
      const promptSkip = new Set()

      /**
       * @type {{
       *   [key in SponsorBlockCategory]: {
       *     color: string,
       *     skip: 'autoSkip' | 'promptToSkip' | 'showInSeekBar' | 'doNothing'
       *   }
       * }} */
      const categoryData = {}

      sponsorCategories.forEach(x => {
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
          autoSkip.add(x)
        }

        if (sponsorVal.skip === 'promptToSkip') {
          autoSkip.add(x)
        }

        categoryData[x] = sponsorVal
      })
      return { autoSkip, seekBar, promptSkip, categoryData }
    },

    useVrMode: function () {
      return this.format === 'dash' && this.vrProjection === 'EQUIRECTANGULAR'
    },

    uiConfig: function () {
      /** @type {shaka.extern.UIConfiguration} */
      const uiConfig = {
        controlPanelElements: [
          'play_pause',
          'mute',
          'volume',
          'time_and_duration',
          'spacer'
        ],
        overflowMenuButtons: [],

        // only set this to label when we actually have labels, so that the warning doesn't show up
        // about it being set to labels, but that the audio tracks don't have labels
        trackLabelFormat: this.hasMultipleAudioTracks ? TrackLabelFormat.LABEL : TrackLabelFormat.LANGUAGE,
        // Only set it to label if we added the captions ourselves,
        // some live streams come with subtitles in the DASH manifest, but without labels
        textTrackLabelFormat: this.captions.length > 0 ? TrackLabelFormat.LABEL : TrackLabelFormat.LANGUAGE,
        displayInVrMode: this.useVrMode
      }

      /** @type {string[]} */
      let elementList = []

      if (this.useOverFlowMenu) {
        uiConfig.overflowMenuButtons = [
          'ft_screenshot',
          'playback_rate',
          'loop',
          'language',
          'captions',
          'picture_in_picture',
          'ft_full_window',
          this.format === 'legacy' ? 'ft_legacy_quality' : 'quality',
          'recenter_vr',
          'toggle_stereoscopic',
        ]

        elementList = uiConfig.overflowMenuButtons

        uiConfig.controlPanelElements.push('overflow_menu')
      } else {
        uiConfig.controlPanelElements.push(
          'recenter_vr',
          'toggle_stereoscopic',
          'ft_screenshot',
          'playback_rate',
          'loop',
          'language',
          'captions',
          'picture_in_picture',
          'ft_theatre_mode',
          'ft_full_window',
          this.format === 'legacy' ? 'ft_legacy_quality' : 'quality'
        )

        elementList = uiConfig.controlPanelElements
      }

      uiConfig.controlPanelElements.push('fullscreen')

      if (!process.env.IS_ELECTRON || !this.enableScreenshot || this.format === 'audio') {
        const index = elementList.indexOf('ft_screenshot')
        elementList.splice(index, 1)
      }

      if (!this.theatrePossible) {
        const index = elementList.indexOf('ft_theatre_mode')
        // doesn't exist in overflow menu, as theatre mode only works on wide screens
        if (index !== -1) {
          elementList.splice(index, 1)
        }
      }

      // When the local API is supported, we generate our own manifest with the local API manifest generator,
      // to workaround Invidious limitations, when it isn't supported we use Invidious' own one
      // Invidious' manifest has labels on things that shouldn't be labelled,
      // so lets hide the audio track selector in the web build
      // TODO: consider fixing it with manifest.dash.manifestPreprocessor in the player config
      if (!process.env.SUPPORTS_LOCAL_API) {
        const index = elementList.indexOf('language')
        elementList.splice(index, 1)
      }

      if (this.format === 'audio') {
        const index = elementList.indexOf('picture_in_picture')
        elementList.splice(index, 1)
      }

      if (this.isLive) {
        const index = elementList.indexOf('loop')
        elementList.splice(index, 1)
      }

      if (!this.useVrMode) {
        const indexRecenterVr = elementList.indexOf('recenter_vr')
        elementList.splice(indexRecenterVr, 1)

        const indexToggleStereoscopic = elementList.indexOf('toggle_stereoscopic')
        elementList.splice(indexToggleStereoscopic, 1)
      }

      return uiConfig
    }
  },
  watch: {
    displayVideoPlayButton: function (newValue) {
      this.nonReactive.ui.configure({
        addBigPlayButton: newValue
      })
    },

    enterFullscreenOnDisplayRotate: function (newValue) {
      this.nonReactive.ui.configure({
        enableFullscreenOnRotation: newValue
      })
    },

    playbackRates: function (newValue) {
      this.nonReactive.ui.configure({
        playbackRates: newValue
      })
    },

    uiConfig: function (newValue, oldValue) {
      if (newValue !== oldValue && this.nonReactive.ui) {
        this.configureUI()
      }
    },

    videoVolumeMouseScroll: function (newValue, oldValue) {
      if (newValue !== oldValue && this.nonReactive.ui) {
        this.configureUI()
      }
    },

    videoPlaybackRateMouseScroll: function (newValue, oldValue) {
      if (newValue !== oldValue && this.nonReactive.ui) {
        this.configureUI()
      }
    },

    videoSkipMouseScroll: function (newValue, oldValue) {
      if (newValue !== oldValue && this.nonReactive.ui) {
        this.configureUI()
      }
    },

    /**
     * Handles changing between formats. It tries its best to backup and restore the settings:
     * - playback position
     * - paused state
     * - audio track
     * - captions track
     * - video quality
     * @param {'dash'|'audio'|'legacy'} newFormat
     * @param {'dash'|'audio'|'legacy'} oldFormat
     */
    format: async function (newFormat, oldFormat) {
      const player = this.nonReactive.player

      // format switch happened before the player loaded, probably because of an error
      // as there are no previous player settings to restore, we should treat it like this was the original format
      if (!this.hasLoaded) {
        player.configure(this.getPlayerConfig(newFormat, this.defaultQuality === 'auto'))

        await this.performFirstLoad()
        return
      }

      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      const wasPaused = video.paused

      const useAutoQuality = oldFormat === 'legacy' ? this.defaultQuality === 'auto' : player.getConfiguration().abr.enabled

      if (!wasPaused) {
        video.pause()
      }

      const playbackPosition = video.currentTime

      const activeCaptionIndex = player.getTextTracks().findIndex(caption => caption.active)

      if (activeCaptionIndex >= 0 && player.isTextTrackVisible()) {
        this.restoreCaptionIndex = activeCaptionIndex

        // hide captions before switching as shaka/the browser doesn't clean up the displayed captions
        // when switching away from the legacy formats
        await player.setTextTrackVisibility(false)
      } else {
        this.restoreCaptionIndex = null
      }

      if (oldFormat === 'legacy') {
        await this.cleanUpLegacyTextDisplay()
      }

      if (newFormat === 'legacy' && this.sortedCaptions.length > 0) {
        await this.setUpLegacyTextDisplay(video, this.$refs.container)
      }

      if (newFormat === 'audio' || newFormat === 'dash') {
        /** @type {{language: string, role: string, channelsCount: number}|undefined} */
        let audioTrack
        let dimension

        if (oldFormat === 'legacy' && newFormat === 'dash') {
          const legacyFormat = this.activeLegacyFormat

          if (!useAutoQuality) {
            dimension = qualityLabelToDimension(legacyFormat.qualityLabel)
          }
        } else if (oldFormat !== 'legacy' && (this.hasMultipleAudioTracks || this.hasMultipleAudioChannelCounts)) {
          const track = player.getVariantTracks().find(track => track.active)

          audioTrack = {
            language: track.language,
            role: track.audioRoles[0],
            channelsCount: track.channelsCount
          }
        }

        player.configure(this.getPlayerConfig(newFormat, useAutoQuality))

        try {
          await player.load(this.manifestSrc, playbackPosition, this.manifestMimeType)

          if (dimension) {
            this.setDashQuality(dimension)
          }

          if (audioTrack) {
            player.selectAudioLanguage(audioTrack.language, audioTrack.role, audioTrack.channelsCount)
          }
        } catch (error) {
          this.handleError(error, 'loading dash/audio manifest for format switch', `${oldFormat} -> ${newFormat}`)
        }
        this.activeLegacyFormat = null
      } else {
        await this.setLegacyQuality(oldFormat, playbackPosition)
      }

      if (wasPaused) {
        video.pause()
      }
    },

    showStats: function (newValue) {
      const player = this.nonReactive.player

      if (newValue) {
        // for abr changes/auto quality
        player.addEventListener('adaptation', this.updateQualityStats)

        // for manual changes e.g. in quality selector
        player.addEventListener('variantchanged', this.updateQualityStats)
      } else {
        // for abr changes/auto quality
        player.removeEventListener('adaptation', this.updateQualityStats)

        // for manual changes e.g. in quality selector
        player.removeEventListener('variantchanged', this.updateQualityStats)
      }
    },

    activeLegacyFormat: 'updateLegacyQualityStats',

    locale: 'setLocale'
  },
  created: function () {
    if (this.enableSubtitlesByDefault && this.captions.length > 0) {
      this.restoreCaptionIndex = 0
    }
  },
  mounted: async function () {
    /** @type {HTMLVideoElement} */
    const videoElement = this.$refs.video

    const volume = sessionStorage.getItem('volume')
    if (volume !== null) {
      videoElement.volume = parseFloat(volume)
    }

    const muted = sessionStorage.getItem('muted')
    if (muted !== null) {
      // as sessionStorage stores string values which are truthy by default so we must check with 'true'
      // otherwise 'false' will be returned as true as well
      videoElement.muted = (muted === 'true')
    }

    videoElement.playbackRate = this.defaultPlayback
    videoElement.defaultPlaybackRate = this.defaultPlayback

    const localPlayer = new shaka.Player()

    const ui = new shaka.ui.Overlay(
      localPlayer,
      this.$refs.container,
      videoElement,
      this.$refs.vrCanvas
    )
    this.nonReactive.ui = ui

    // This has to be called after creating the UI, so that the player uses the UI's UITextDisplayer
    // otherwise it uses the browsers native captions which get displayed underneath the UI controls
    await localPlayer.attach(videoElement)

    // check if the component is already getting destroyed
    // which is possible because this function runs asynchronously
    if (!this.nonReactive.ui) {
      return
    }

    const controls = ui.getControls()
    const player = controls.getPlayer()
    this.nonReactive.player = player

    player.addEventListener('error', event => this.handleError(event.detail, 'shaka error handler'))

    player.configure(this.getPlayerConfig(this.format, this.defaultQuality === 'auto'))

    if (process.env.SUPPORTS_LOCAL_API) {
      player.getNetworkingEngine().registerRequestFilter(this.requestFilter)
      player.getNetworkingEngine().registerResponseFilter(this.responseFilter)
    }

    await this.setLocale(this.locale)

    // check if the component is already getting destroyed
    // which is possible because this function runs asynchronously
    if (!this.nonReactive.ui || !this.nonReactive.player) {
      return
    }

    if (process.env.IS_ELECTRON) {
      this.registerScreenshotButton()
    }
    this.registerTheatreModeButton()
    this.registerFullWindowButton()
    this.registerLegacyQualitySelection()
    this.registerStatsButton()

    if (ui.isMobile()) {
      this.useOverFlowMenu = true
    } else {
      this.useOverFlowMenu = this.$refs.container.getBoundingClientRect().width <= USE_OVERFLOW_MENU_WIDTH_THRESHOLD

      this.resizeObserver = new ResizeObserver(this.resized)
      this.resizeObserver.observe(this.$refs.container)
    }

    controls.addEventListener('uiupdated', this.addUICustomizations)
    this.configureUI(true)

    if (this.format === 'legacy' && this.sortedCaptions.length > 0) {
      await this.setUpLegacyTextDisplay(videoElement, this.$refs.container)

      // check if the component is already getting destroyed
      // which is possible because this function runs asynchronously
      if (!this.nonReactive.ui || !this.nonReactive.player) {
        return
      }
    }

    document.removeEventListener('keydown', this.keyboardShortcutHandler)
    document.addEventListener('keydown', this.keyboardShortcutHandler)

    player.addEventListener('loading', () => {
      this.hasLoaded = false

      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null)
        navigator.mediaSession.setActionHandler('pause', null)
        navigator.mediaSession.setActionHandler('seekto', null)
        navigator.mediaSession.setActionHandler('seekbackward', null)
        navigator.mediaSession.setActionHandler('seekforward', null)
        navigator.mediaSession.setPositionState()
      }
    })

    player.addEventListener('loaded', this.handleLoaded)

    if (this.format !== 'legacy') {
      player.addEventListener('streaming', () => {
        if (this.startTime !== null) {
          if (player.isLive() || player.getManifestType() === 'HLS') {
            player.updateStartTime(null)
          } else {
            const { end } = player.seekRange()

            if (this.startTime > (end - 10)) {
              player.updateStartTime(end - 10)
            }
          }
        }

        this.hasMultipleAudioTracks = player.getAudioLanguagesAndRoles().length > 1
        this.hasMultipleAudioChannelCounts = new Set(player.getVariantTracks().map(track => track.channelsCount)).size > 1

        if (this.format === 'dash') {
          const firstVariant = player.getVariantTracks()[0]

          // force the player aspect ratio to 16:9 to avoid overflowing the layout
          this.forceAspectRatio = firstVariant.width / firstVariant.height < 1.5
        }
      })
    } else {
      // force the player aspect ratio to 16:9 to avoid overflowing the layout, when the video is too tall

      // Invidious doesn't provide any height or width information for their legacy formats, so lets read it from the video instead
      // they have a size property but it's hard-coded, so it reports false information for shorts for example

      const firstFormat = this.legacyFormats[0]
      if (typeof firstFormat.width === 'undefined' || typeof firstFormat.height === 'undefined') {
        videoElement.addEventListener('loadeddata', () => {
          this.forceAspectRatio = videoElement.videoWidth / videoElement.videoHeight < 1.5
        }, {
          once: true
        })
      } else {
        this.forceAspectRatio = firstFormat.width / firstFormat.height < 1.5
      }
    }

    if (this.useSponsorBlock && this.sponsorSkips.seekBar.length > 0) {
      let segments, averageDuration

      try {
        ({ segments, averageDuration } = await getSponsorBlockSegments(this.videoId, this.sponsorSkips.seekBar))
      } catch (e) {
        console.error(e)
        segments = []
      }

      // check if the component is already getting destroyed
      // which is possible because this function runs asynchronously
      if (!this.nonReactive.ui || !this.nonReactive.player) {
        return
      }

      if (segments.length > 0) {
        this.sponsorBlockSegments = segments

        this.createSponsorBlockMarkers(segments, averageDuration)
      }
    }

    window.addEventListener('beforeunload', this.stopPowerSaveBlocker)

    await this.performFirstLoad()
  },
  beforeDestroy: function () {
    this.hasLoaded = false
    document.body.classList.remove('playerFullWindow')

    document.removeEventListener('keydown', this.keyboardShortcutHandler)

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    this.cleanUpLegacyTextDisplay()

    if (this.nonReactive.ui) {
      // destroying the ui also destroys the player
      this.nonReactive.ui.destroy()
      this.nonReactive.ui = null
      this.nonReactive.player = null
    }

    this.stopPowerSaveBlocker()
    window.removeEventListener('beforeunload', this.stopPowerSaveBlocker)

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none'
      navigator.mediaSession.setPositionState()
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('seekforward', null)
      navigator.mediaSession.setActionHandler('seekbackward', null)
      navigator.mediaSession.setActionHandler('seekto', null)
    }

    this.skippedSponsorBlockSegments.forEach(segment => clearTimeout(segment.timeoutId))
  },
  methods: {
    /**
     * @param {'dash'|'audio'|'legacy'} format
     * @param {boolean} useAutoQuality
     * @returns {shaka.extern.PlayerConfiguration}
     **/
    getPlayerConfig: function (format, useAutoQuality = false) {
      return {
        // YouTube uses these values and they seem to work well in FreeTube too,
        // so we might as well use them
        streaming: {
          bufferingGoal: 180,
          rebufferingGoal: 0.02,
          bufferBehind: 300
        },
        manifest: {
          disableVideo: format === 'audio',

          // makes captions work for live streams and doesn't seem to have any negative affect on VOD videos
          segmentRelativeVttTiming: true,
          dash: {
            manifestPreprocessorTXml: this.manifestPreprocessorTXml
          }
        },
        abr: {
          enabled: useAutoQuality,

          // This only affects the "auto" quality, users can still manually select whatever quality they want.
          restrictToElementSize: true
        },
        autoShowText: shaka.config.AutoShowText.NEVER,

        // Electron doesn't like YouTube's vp9 VR video streams and throws:
        // "CHUNK_DEMUXER_ERROR_APPEND_FAILED: Projection element is incomplete; ProjectionPoseYaw required."
        // So use the AV1 and h264 codecs instead which it doesn't reject
        preferredVideoCodecs: typeof this.vrProjection === 'string' ? ['av01', 'avc1'] : []
      }
    },

    /**
     * @param {shaka.extern.xml.Node} mpdNode
     */
    manifestPreprocessorTXml: function (mpdNode) {
      /** @type {shaka.extern.xml.Node[]} */
      const periods = mpdNode.children?.filter(child => typeof child !== 'string' && child.tagName === 'Period') ?? []

      this.sortAdapationSetsByCodec(periods)

      if (mpdNode.attributes.type === 'dynamic') {
        // fix live stream loading issues
        // YouTube uses a 12 second delay on the official website for normal streams
        // and a shorter one for low latency streams
        // If we don't add a little bit of a delay, we get presented with a loading symbol every 5 seconds,
        // while shaka-player processes the new manifest and segments
        const minimumUpdatePeriod = parseFloat(mpdNode.attributes.minimumUpdatePeriod.match(/^PT(\d+(?:\.\d+)?)S$/)[1])
        mpdNode.attributes.suggestedPresentationDelay = `PT${(minimumUpdatePeriod * 2).toFixed(3)}S`

        // fix live streams with subtitles having duplicate Representation ids
        // shaka-player throws DASH_DUPLICATE_REPRESENTATION_ID if we don't fix it

        for (const period of periods) {
          /** @type {shaka.extern.xml.Node[]} */
          const representations = []

          for (const periodChild of period.children) {
            if (typeof periodChild !== 'string' && periodChild.tagName === 'AdaptationSet') {
              for (const adaptationSetChild of periodChild.children) {
                if (typeof adaptationSetChild !== 'string' && adaptationSetChild.tagName === 'Representation') {
                  representations.push(adaptationSetChild)
                }
              }
            }
          }

          const knownIds = new Set()
          let counter = 0
          for (const representation of representations) {
            const id = representation.attributes.id

            if (knownIds.has(id)) {
              const newId = `${id}-ft-fix-${counter}`

              representation.attributes.id = newId
              knownIds.add(newId)
              counter++
            } else {
              knownIds.add(id)
            }
          }
        }
      }
    },

    /**
     * @param {shaka.extern.xml.Node[]} periods
     */
    sortAdapationSetsByCodec: function (periods) {
      /** @param {shaka.extern.xml.Node} adaptationSet */
      const getCodecsPrefix = (adaptationSet) => {
        const codecs = adaptationSet.attributes.codecs ??
          adaptationSet.children
            .find(child => typeof child !== 'string' && child.tagName === 'Representation').attributes.codecs

        return codecs.split('.')[0]
      }

      const codecPriorities = [
        // audio
        'opus',
        'mp4a',
        'ec-3',
        'ac-3',

        // video
        'av01',
        'vp09',
        'vp9',
        'avc1'
      ]

      for (const period of periods) {
        period.children
          ?.sort((
            /** @type {shaka.extern.xml.Node | string} */ a,
            /** @type {shaka.extern.xml.Node | string} */ b
          ) => {
            if (typeof a === 'string' || a.tagName !== 'AdaptationSet' ||
              typeof b === 'string' || b.tagName !== 'AdaptationSet') {
              return 0
            }

            const typeA = a.attributes.contentType || a.attributes.mimeType.split('/')[0]
            const typeB = b.attributes.contentType || b.attributes.mimeType.split('/')[0]

            // always place image and text tracks AdaptionSets last in the manifest

            if (typeA !== 'video' && typeA !== 'audio') {
              return 1
            }
            if (typeB !== 'video' && typeB !== 'audio') {
              return -1
            }

            const codecsPrefixA = getCodecsPrefix(a)
            const codecsPrefixB = getCodecsPrefix(b)

            return codecPriorities.indexOf(codecsPrefixA) - codecPriorities.indexOf(codecsPrefixB)
          })
      }
    },

    performFirstLoad: async function () {
      const player = this.nonReactive.player

      if (this.format === 'dash' || this.format === 'audio') {
        try {
          await player.load(this.manifestSrc, this.startTime, this.manifestMimeType)

          if (this.defaultQuality !== 'auto') {
            if (this.format === 'dash') {
              this.setDashQuality(this.defaultQuality)
            } else {
              let variants = player.getVariantTracks()

              if (this.hasMultipleAudioTracks) {
                // default audio track
                variants = variants.filter(variant => variant.audioRoles.includes('main'))
              }

              const highestBandwidth = Math.max(...variants.map(variant => variant.audioBandwidth))
              variants = variants.filter(variant => variant.audioBandwidth === highestBandwidth)

              player.selectVariantTrack(variants[0])
            }
          }
        } catch (error) {
          this.handleError(error, 'loading dash/audio manifest and setting default quality in mounted')
        }
      } else {
        await this.setLegacyQuality(null, this.startTime)
      }
    },

    /**
     * Adds the captions and thumbnail tracks, also restores the previously selected captions track,
     * if this was triggered by a format change and the user had the captions enabled.
     */
    handleLoaded: async function () {
      this.hasLoaded = true
      this.$emit('loaded')

      const player = this.nonReactive.player

      // ideally we would set this in the `streaming` event handler, but for HLS this is only set to true after the loaded event fires.
      this.isLive = player.isLive()

      const promises = []

      for (const caption of this.sortedCaptions) {
        promises.push(
          player.addTextTrackAsync(
            caption.url,
            caption.language,
            'captions',
            caption.mimeType,
            undefined, // codec, only needed if the captions are inside a container (e.g. mp4)
            caption.label
          )
            .catch(error => this.handleError(error, 'addTextTrackAsync', caption))
        )
      }

      if (!this.isLive && this.storyboardSrc) {
        promises.push(
          player.addThumbnailsTrack(this.storyboardSrc, 'text/vtt').catch(error => this.handleError(error, 'addThumbnailsTrack', this.storyboardSrc))
        )
      }

      await Promise.all(promises)

      if (this.restoreCaptionIndex !== null) {
        const index = this.restoreCaptionIndex
        this.restoreCaptionIndex = null

        const textTrack = player.getTextTracks()[index]

        if (textTrack) {
          player.selectTextTrack(textTrack)

          if (this.format === 'legacy') {
            // ensure that only the track we want enabled is enabled
            // for some reason, after we set the visibility to true
            // a second track gets enabled, not sure why,
            // but as far as i can tell it might be Electron itself doing it
            // weirdly it doesn't happen for shaka's caption selector but we seem to be doing the same stuff
            // for the moment this hack works
            //
            // maybe this issue: https://github.com/shaka-project/shaka-player/issues/3474

            /** @type {TextTrackList} */
            const textTracks = this.$refs.video.textTracks

            textTracks.addEventListener('change', () => {
              for (let i = 0; i < textTracks.length; i++) {
                const textTrack = textTracks[i]
                if (textTrack.kind === 'captions' || textTrack.kind === 'subtitles') {
                  textTrack.mode = i === index ? 'showing' : 'disabled'
                }
              }
            }, {
              once: true
            })
          }

          await player.setTextTrackVisibility(true)
        }
      }

      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', this.mediaSessionActionHandler)
        navigator.mediaSession.setActionHandler('pause', this.mediaSessionActionHandler)

        if (this.canSeek()) {
          navigator.mediaSession.setActionHandler('seekto', this.mediaSessionActionHandler)
          navigator.mediaSession.setActionHandler('seekbackward', this.mediaSessionActionHandler)
          navigator.mediaSession.setActionHandler('seekforward', this.mediaSessionActionHandler)
        } else {
          navigator.mediaSession.setActionHandler('seekto', null)
          navigator.mediaSession.setActionHandler('seekbackward', null)
          navigator.mediaSession.setActionHandler('seekforward', null)
        }
      }
    },

    /**
     * For the first call we want to set initial values for options that may change later,
     * as well as setting the options that we won't change again.
     *
     * For all subsequent calls we only want to reconfigure the options that have changed.
     * e.g. due to the active format changing or the user changing settings
     * @param {boolean} firstTime
     */
    configureUI: function (firstTime = false) {
      if (firstTime) {
        const firstTimeConfig = {
          addSeekBar: true,
          customContextMenu: true,
          contextMenuElements: ['ft_stats'],
          enableTooltips: true,
          seekBarColors: {
            played: 'var(--primary-color)'
          },
          volumeBarColors: {
            level: 'var(--primary-color)'
          },

          // these have their own watchers
          addBigPlayButton: this.displayVideoPlayButton,
          enableFullscreenOnRotation: this.enterFullscreenOnDisplayRotate,
          playbackRates: this.playbackRates,

          // we have our own ones (shaka-player's ones are quite limited)
          enableKeyboardPlaybackControls: false,

          // TODO: enable this when electron gets document PiP support
          // https://github.com/electron/electron/issues/39633
          preferDocumentPictureInPicture: false
        }

        // Combine the config objects so we only need to do one configure call
        // as shaka-player recreates the UI when you call configure
        Object.assign(firstTimeConfig, this.uiConfig)

        this.nonReactive.ui.configure(firstTimeConfig)
      } else {
        this.nonReactive.ui.configure(this.uiConfig)
      }
    },

    addUICustomizations: function () {
      /** @type {HTMLDivElement} */
      const controlsContainer = this.nonReactive.ui.getControls().getControlsContainer()

      if (!this.useVrMode) {
        if (this.videoVolumeMouseScroll || this.videoSkipMouseScroll || this.videoPlaybackRateMouseScroll) {
          controlsContainer.addEventListener('wheel', (event) => {
            /** @type {DOMTokenList} */
            const classList = event.target.classList

            if (classList.contains('shaka-scrim-container') ||
              classList.contains('shaka-fast-foward-container') ||
              classList.contains('shaka-rewind-container')) {
              //

              if (event.ctrlKey || event.metaKey) {
                if (this.videoPlaybackRateMouseScroll) {
                  this.mouseScrollPlaybackRate(event)
                }
              } else {
                if (this.videoVolumeMouseScroll) {
                  this.mouseScrollVolume(event)
                } else if (this.videoSkipMouseScroll) {
                  this.mouseScrollSkip(event)
                }
              }
            }
          })
        }

        if (this.videoPlaybackRateMouseScroll) {
          controlsContainer.addEventListener('click', (event) => {
            if (event.ctrlKey || event.metaKey) {
              // stop shaka-player's click handler firing
              event.stopPropagation()

              /** @type {HTMLVideoElement} */
              const video = this.$refs.video

              video.playbackRate = this.defaultPlayback
              video.defaultPlaybackRate = this.defaultPlayback
            }
          }, true)
        }
      }

      // make scrolling over volume slider change the volume
      this.$refs.container.querySelector('.shaka-volume-bar').addEventListener('wheel', this.mouseScrollVolume)

      // title overlay when the video is fullscreened
      // placing this inside the controls container so that we can fade it in and out at the same time as the controls
      const fullscreenTitleOverlay = document.createElement('h1')
      fullscreenTitleOverlay.textContent = this.title
      fullscreenTitleOverlay.className = 'playerFullscreenTitleOverlay'
      controlsContainer.appendChild(fullscreenTitleOverlay)

      if (this.useSponsorBlock && this.sponsorBlockSegments.length > 0 && this.hasLoaded) {
        const seekRange = this.nonReactive.player.seekRange()

        this.createSponsorBlockMarkers(this.sponsorBlockSegments, seekRange.end - seekRange.start)
      }
    },

    /**
     * @param {string} locale
     */
    setLocale: async function (locale) {
      // For most of FreeTube's locales their is an equivalent one in shaka-player,
      // however if there isn't one we should fall back to US English.
      // At the time of writing "et", "eu", "gl", "is" don't have any translations
      const shakaLocale = LOCALE_MAPPINGS.get(locale) ?? 'en'

      const localization = this.nonReactive.ui.getControls().getLocalization()

      const cachedLocales = this.$store.getters.getCachedPlayerLocales

      if (!this.loadedLocales.has(shakaLocale)) {
        if (!Object.hasOwn(cachedLocales, shakaLocale)) {
          await this.cachePlayerLocale(shakaLocale)
        }

        localization.insert(shakaLocale, new Map(Object.entries(cachedLocales[shakaLocale])))

        this.loadedLocales.add(shakaLocale)
      }

      localization.changeLocale([shakaLocale])

      this.events.dispatchEvent(new CustomEvent('localeChanged'))
    },

    handlePlay: function () {
      this.startPowerSaveBlocker()

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
    },

    handlePause: function () {
      this.stopPowerSaveBlocker()

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused'
      }
    },

    handleEnded: function () {
      this.stopPowerSaveBlocker()

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none'
      }

      this.$emit('ended')
    },

    handleTimeupdate: function () {
      const currentTime = this.$refs.video.currentTime

      this.$emit('timeupdate', currentTime)

      if (this.showStats && this.hasLoaded) {
        this.updateStats()
      }

      if (this.useSponsorBlock && this.sponsorBlockSegments.length > 0 && this.canSeek()) {
        this.skipSponsorBlockSegments(currentTime)
      }

      if ('mediaSession' in navigator) {
        this.updateMediaSessionPositionState()
      }
    },

    /** @type {shaka.extern.RequestFilter} */
    requestFilter: function (type, request, _context) {
      if (type === RequestType.SEGMENT) {
        const url = new URL(request.uris[0])

        // only when we aren't proxying through Invidious,
        // it doesn't like the range param and makes get requests to youtube anyway
        if (url.hostname.endsWith('.googlevideo.com') && url.pathname === '/videoplayback') {
          request.method = 'POST'
          request.body = new Uint8Array([0x78, 0]) // protobuf: { 15: 0 } (no idea what it means but this is what YouTube uses)

          if (request.headers.Range) {
            request.uris[0] += `&range=${request.headers.Range.split('=')[1]}`
            delete request.headers.Range
          }

          request.uris[0] += '&alr=yes'
        }
      }
    },

    /**
     * Handles Application Level Redirects
     * Based on the example in the YouTube.js repository
     * @type {shaka.extern.ResponseFilter}
     */
    responseFilter: async function (type, response, context) {
      if (type === RequestType.SEGMENT) {
        if (response.data && response.data.byteLength > 4 &&
          new DataView(response.data).getUint32(0) === HTTP_IN_HEX) {
          // Interpret the response data as a URL string.
          const responseAsString = shaka.util.StringUtils.fromUTF8(response.data)

          const retryParameters = this.nonReactive.player.getConfiguration().streaming.retryParameters

          // Make another request for the redirect URL.
          const uris = [responseAsString]
          const redirectRequest = shaka.net.NetworkingEngine.makeRequest(uris, retryParameters)
          const requestOperation = this.nonReactive.player.getNetworkingEngine().request(type, redirectRequest, context)
          const redirectResponse = await requestOperation.promise

          // Modify the original response to contain the results of the redirect
          // response.
          response.data = redirectResponse.data
          response.headers = redirectResponse.headers
          response.uri = redirectResponse.uri
        }
      }
    },

    /**
     * @param {shaka.util.Error} error
     * @param {string} context
     * @param {object} details
     */
    handleError: async function (error, context, details) {
      logShakaError(error, context, details)

      // text related errors aren't serious (captions and seek bar thumbnails), so we should just log them
      // TODO: consider only emitting when the severity is crititcal?
      if (error.category !== shaka.util.Error.Category.TEXT) {
        this.$emit('error', error)

        this.stopPowerSaveBlocker()

        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'none'
        }
      }
    },

    /** @type {ResizeObserverCallback} */
    resized: function (entries) {
      this.useOverFlowMenu = entries[0].contentBoxSize[0].inlineSize <= USE_OVERFLOW_MENU_WIDTH_THRESHOLD
    },

    /**
     * @param {number} quality
     */
    setDashQuality: function (quality) {
      const player = this.nonReactive.player

      let variants = player.getVariantTracks()

      if (this.hasMultipleAudioTracks) {
        // default audio track
        variants = variants.filter(variant => variant.audioRoles.includes('main'))
      }

      const isPortrait = variants[0].height > variants[0].width

      let matches = variants.filter(variant => {
        return quality === (isPortrait ? variant.width : variant.height)
      })

      if (matches.length === 0) {
        matches = variants.filter(variant => {
          return quality > (isPortrait ? variant.width : variant.height)
        })
      }

      matches.sort((a, b) => isPortrait ? b.width - a.width : b.height - a.height)
      variants = matches

      player.selectVariantTrack(variants[0])
    },

    /**
     * @param {'dash'|'audio'|null} previousFormat
     * @param {number|null} playbackPosition
     */
    setLegacyQuality: async function (previousFormat = null, playbackPosition = null) {
      /** @type {object[]} */
      const legacyFormats = this.legacyFormats

      // TODO: switch to using height and width when Invidious starts returning them, instead of parsing the quality label

      let previousQuality
      if (previousFormat === 'dash') {
        const previousTrack = this.nonReactive.player.getVariantTracks().find(track => track.active)

        previousQuality = previousTrack.height > previousTrack.width ? previousTrack.width : previousTrack.height
      } else if (this.defaultQuality === 'auto') {
        previousQuality = Infinity
      } else {
        previousQuality = this.defaultQuality
      }

      let matches = legacyFormats.filter(variant => {
        return previousQuality === qualityLabelToDimension(variant.qualityLabel)
      })

      if (matches.length === 0) {
        matches = legacyFormats.filter(variant => {
          return previousQuality > qualityLabelToDimension(variant.qualityLabel)
        })

        if (matches.length > 0) {
          matches.sort((a, b) => b.bitrate - a.bitrate)
        } else {
          matches = legacyFormats.sort((a, b) => a.bitrate - b.bitrate)
        }
      }

      this.hasMultipleAudioTracks = false
      this.hasMultipleAudioChannelCounts = false

      this.events.dispatchEvent(new CustomEvent('setLegacyFormat', {
        detail: {
          format: matches[0],
          playbackPosition
        }
      }))
    },

    gatherInitialStatsValues: function () {
      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      this.stats.volume = (video.volume * 100).toFixed(1)

      if (this.format === 'legacy') {
        this.updateLegacyQualityStats(this.activeLegacyFormat)
      }

      const playerDimensions = video.getBoundingClientRect()
      this.stats.playerDimensions = {
        width: playerDimensions.width.toFixed(0),
        height: playerDimensions.height.toFixed(0)
      }

      const player = this.nonReactive.player

      if (!this.hasLoaded) {
        player.addEventListener('loaded', () => {
          if (this.showStats) {
            if (this.format !== 'legacy') {
              this.updateQualityStats({
                newTrack: player.getVariantTracks().find(track => track.active)
              })
            }

            this.updateStats()
          }
        }, {
          once: true
        })

        return
      }

      if (this.format !== 'legacy') {
        this.updateQualityStats({
          newTrack: player.getVariantTracks().find(track => track.active)
        })
      }

      this.updateStats()
    },

    /**
     * @param {{
     *   type: ('adaptation'|'variantchanged'),
     *   newTrack: shaka.extern.Track,
     *   oldTrack: shaka.extern.Track
     * }} track
     */
    updateQualityStats: function ({ newTrack }) {
      if (!this.showStats || this.format === 'legacy') {
        return
      }

      this.stats.bitrate = (newTrack.bandwidth / 1000).toFixed(2)

      // for videos with multiple audio tracks, youtube.js appends the track id to the itag, to make it unique
      this.stats.codecs.audioItag = newTrack.originalAudioId.split('-')[0]
      this.stats.codecs.audioCodec = newTrack.audioCodec

      if (this.format === 'dash') {
        this.stats.resolution.frameRate = newTrack.frameRate

        this.stats.codecs.videoItag = newTrack.originalVideoId
        this.stats.codecs.videoCodec = newTrack.videoCodec

        this.stats.resolution.width = newTrack.width
        this.stats.resolution.height = newTrack.height
      }
    },

    updateLegacyQualityStats: function (newFormat) {
      if (!this.showStats || this.format !== 'legacy') {
        return
      }

      const { fps, bitrate, mimeType, itag, width, height } = newFormat

      const codecsMatch = mimeType.match(/codecs="(?<videoCodec>.+), ?(?<audioCodec>.+)"/)

      this.stats.codecs.audioItag = itag
      this.stats.codecs.audioCodec = codecsMatch.groups.audioCodec

      this.stats.codecs.videoItag = itag
      this.stats.codecs.videoCodec = codecsMatch.groups.videoCodec

      this.stats.resolution.frameRate = fps

      this.stats.bitrate = (bitrate / 1000).toFixed(2)

      if (typeof width === 'undefined' || typeof height === 'undefined') {
        // Invidious doesn't provide any height or width information for their legacy formats, so lets read it from the video instead
        // they have a size property but it's hard-coded, so it reports false information for shorts for example
        /** @type {HTMLVideoElement} */
        const video = this.$refs.video

        if (this.hasLoaded) {
          this.stats.resolution.width = video.videoWidth
          this.stats.resolution.height = video.videoHeight
        } else {
          video.addEventListener('loadeddata', () => {
            this.stats.resolution.width = video.videoWidth
            this.stats.resolution.height = video.videoHeight
          }, {
            once: true
          })
        }
      } else {
        this.stats.resolution.width = width
        this.stats.resolution.height = height
      }
    },

    updateStats: function () {
      const player = this.nonReactive.player

      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      const playerDimensions = video.getBoundingClientRect()
      this.stats.playerDimensions = {
        width: playerDimensions.width.toFixed(0),
        height: playerDimensions.height.toFixed(0)
      }

      const playerStats = player.getStats()

      if (this.format !== 'audio') {
        this.stats.frames = {
          droppedFrames: playerStats.droppedFrames,
          totalFrames: playerStats.decodedFrames
        }
      }

      if (this.format !== 'legacy') {
        // estimated bandwidth is NaN for legacy, as none of the requests go through shaka,
        // so it has no way to estimate the bandwidth
        this.stats.bandwidth = (playerStats.estimatedBandwidth / 1000).toFixed(2)
      }

      let bufferedSeconds = 0

      const buffered = player.getBufferedInfo().total

      for (const { start, end } of buffered) {
        bufferedSeconds += end - start
      }

      const seekRange = player.seekRange()
      const duration = seekRange.end - seekRange.start

      this.stats.buffered = ((bufferedSeconds / duration) * 100).toFixed(2)
    },

    /**
     * @param {WheelEvent} event
     */
    mouseScrollPlaybackRate: function (event) {
      event.preventDefault()

      if ((event.deltaY < 0 || event.deltaX > 0)) {
        this.changePlayBackRate(0.05)
      } else if ((event.deltaY > 0 || event.deltaX < 0)) {
        this.changePlayBackRate(-0.05)
      }
    },

    /**
     * @param {WheelEvent} event
     */
    mouseScrollSkip: function (event) {
      if (this.canSeek()) {
        event.preventDefault()

        /** @type {HTMLVideoElement} */
        const video = this.$refs.video

        if ((event.deltaY < 0 || event.deltaX > 0)) {
          this.seekBySeconds(this.defaultSkipInterval * video.playbackRate, true)
        } else if ((event.deltaY > 0 || event.deltaX < 0)) {
          this.seekBySeconds(-this.defaultSkipInterval * video.playbackRate, true)
        }
      }
    },

    /**
     * @param {WheelEvent} event
     * */
    mouseScrollVolume: function (event) {
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        event.stopPropagation()

        /** @type {HTMLVideoElement} */
        const video = this.$refs.video

        if (video.muted && (event.deltaY < 0 || event.deltaX > 0)) {
          video.muted = false
          video.volume = 0
        }

        if (!video.muted) {
          if ((event.deltaY < 0 || event.deltaX > 0)) {
            this.changeVolume(0.05)
          } else if ((event.deltaY > 0 || event.deltaX < 0)) {
            this.changeVolume(-0.05)
          }
        }
      }
    },

    changeVolume: function (step) {
      /** @type {HTMLInputElement} */
      const volumeBar = this.$refs.container.querySelector('.shaka-volume-bar')

      const newValue = parseFloat(volumeBar.value) + (step * 100)

      if (newValue < 0) {
        volumeBar.value = 0
      } else if (newValue > 100) {
        volumeBar.value = 100
      } else {
        volumeBar.value = newValue
      }

      volumeBar.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
    },

    updateVolume: function () {
      /** @type {HTMLVideoElement} */
      const video = this.$refs.video
      // https://docs.videojs.com/html5#volume
      if (sessionStorage.getItem('muted') === 'false' && video.volume === 0) {
        // If video is muted by dragging volume slider, it doesn't change 'muted' in sessionStorage to true
        // hence compare it with 'false' and set volume to defaultVolume.
        const volume = parseFloat(sessionStorage.getItem('defaultVolume'))
        const muted = true
        sessionStorage.setItem('volume', volume.toString())
        sessionStorage.setItem('muted', String(muted))
      } else {
        // If volume isn't muted by dragging the slider, muted and volume values are carried over to next video.
        const volume = video.volume
        const muted = video.muted
        sessionStorage.setItem('volume', volume.toString())
        sessionStorage.setItem('muted', String(muted))
      }

      if (this.showStats) {
        this.stats.volume = (video.volume * 100).toFixed(1)
      }
    },

    canSeek: function () {
      const player = this.nonReactive.player

      if (!player || !this.hasLoaded) {
        return false
      }

      const seekRange = player.seekRange()

      // Seeking not possible e.g. with HLS
      if (seekRange.start === seekRange.end) {
        return false
      }

      return true
    },

    /**
     * @param {number} seconds The number of seconds to seek by, positive values seek forwards, negative ones seek backwards
     * @param {boolean} canSeek Allow functions that have already checked whether seeking is possible, to skip the extra check (e.g. frameByFrame)
     */
    seekBySeconds: function (seconds, canSeek = false) {
      if (!(canSeek || this.canSeek())) {
        return
      }

      const player = this.nonReactive.player

      const seekRange = player.seekRange()

      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      const currentTime = video.currentTime
      const newTime = currentTime + seconds

      if (newTime < seekRange.start) {
        video.currentTime = seekRange.start
      } else if (newTime > seekRange.end) {
        if (this.isLive) {
          player.goToLive()
        } else {
          video.currentTime = seekRange.end
        }
      } else {
        video.currentTime = newTime
      }
    },

    frameByFrame: function (step) {
      if (this.format === 'audio' || !this.canSeek()) {
        return
      }

      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      video.pause()

      /** @type {number} */
      let fps
      if (this.format === 'legacy') {
        fps = this.activeLegacyFormat.fps
      } else {
        fps = this.nonReactive.player.getVariantTracks().find(track => track.active).frameRate
      }

      const frameTime = 1 / fps
      const dist = frameTime * step
      this.seekBySeconds(dist, true)
    },

    changePlayBackRate: function (step) {
      /** @type {HTMLVideoElement} */
      const video = this.$refs.video
      const newPlaybackRate = parseFloat((video.playbackRate + step).toFixed(2))

      // The following error is thrown if you go below 0.07:
      // The provided playback rate (0.05) is not in the supported playback range.
      if (newPlaybackRate > 0.07 && newPlaybackRate <= this.maxVideoPlaybackRate) {
        video.playbackRate = newPlaybackRate
        video.defaultPlaybackRate = newPlaybackRate
      }
    },

    /**
     * determines whether the jump to the previous or next chapter
     * with the the keyboard shortcuts, should be done
     * first it checks whether there are any chapters (the array is also empty if chapters are hidden)
     * it also checks that the approprate combination was used ALT/OPTION on macOS and CTRL everywhere else
     * @param {KeyboardEvent} event the keyboard event
     * @param {string} direction the direction of the jump either previous or next
     */
    canChapterJump: function (event, direction) {
      const currentChapter = this.currentChapterIndex
      return this.chapters.length > 0 &&
        (direction === 'previous' ? currentChapter > 0 : this.chapters.length - 1 !== currentChapter) &&
        ((process.platform !== 'darwin' && event.ctrlKey) ||
          (process.platform === 'darwin' && event.metaKey))
    },

    takeScreenshot: !process.env.IS_ELECTRON
      ? async function () { }
      : async function () {
        // TODO: needs to be refactored to be less reliant on node stuff, so that it can be used in the web (and android) builds

        /** @type {HTMLVideoElement} */
        const video = this.$refs.video

        const width = video.videoWidth
        const height = video.videoHeight

        if (width <= 0) {
          return
        }

        // Need to set crossorigin="anonymous" for LegacyFormat on Invidious
        // https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
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
            playerTime: video.currentTime,
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
          const wasPlaying = !video.paused
          if (wasPlaying) {
            video.pause()
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
            video.play()
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
              await fs.mkdir(dirPath, { recursive: true })
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

    /**
     * @param {number} currentTime
     */
    skipSponsorBlockSegments: function (currentTime) {
      const { autoSkip } = this.sponsorSkips

      if (autoSkip.size === 0) {
        return
      }

      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      let newTime = 0
      const skippedSegments = []

      this.sponsorBlockSegments.forEach(segment => {
        if (autoSkip.has(segment.category) && currentTime < segment.endTime &&
          (segment.startTime <= currentTime ||
          // if we already have a segment to skip, check if there are any that are less than 150ms later,
          // so that we can skip them all in one go (especially useful on slow connections)
            (newTime > 0 && (segment.startTime < newTime || segment.startTime - newTime <= 0.150) && segment.endTime > newTime))) {
          newTime = segment.endTime
          skippedSegments.push(segment)
        }
      })

      if (newTime === 0 || video.ended) {
        return
      }

      const videoEnd = this.nonReactive.player.seekRange().end

      if (Math.abs(videoEnd - currentTime) < 1 || video.ended) {
        return
      }

      if (newTime > videoEnd || Math.abs(videoEnd - newTime) < 1) {
        newTime = videoEnd
      }

      video.currentTime = newTime

      if (this.sponsorBlockShowSkippedToast) {
        skippedSegments.forEach(({ uuid, category }) => {
          // if the element already exists, just update the timeout, instead of creating a duplicate
          // can happen at the end of the video sometimes
          const existingSkip = this.skippedSponsorBlockSegments.find(skipped => skipped.uuid === uuid)
          if (existingSkip) {
            clearTimeout(existingSkip.timeoutId)

            existingSkip.timeoutId = setTimeout(() => {
              const index = this.skippedSponsorBlockSegments.findIndex(skipped => skipped.uuid === uuid)
              this.skippedSponsorBlockSegments.splice(index, 1)
            }, 2000)
          } else {
            this.skippedSponsorBlockSegments.push({
              uuid,
              translatedCategory: translateSponsorBlockCategory(category),
              timeoutId: setTimeout(() => {
                const index = this.skippedSponsorBlockSegments.findIndex(skipped => skipped.uuid === uuid)
                this.skippedSponsorBlockSegments.splice(index, 1)
              }, 2000)
            })
          }
        })
      }
    },

    /**
     * @param {{
       *   uuid: string
       *   category: SponsorBlockCategory
       *   startTime: number,
       *   endTime: number
       * }[]} segments
     * @param {number} duration As the sponsorblock segments can sometimes load before the video does, we need to pass in the duration here
     */
    createSponsorBlockMarkers: function (segments, duration) {
      const markerBar = document.createElement('div')
      markerBar.className = 'sponsorBlockMarkerContainer'

      segments.forEach(segment => {
        const markerDiv = document.createElement('div')

        markerDiv.title = translateSponsorBlockCategory(segment.category)
        markerDiv.className = `sponsorBlockMarker main${this.sponsorSkips.categoryData[segment.category].color}`
        markerDiv.style.width = `${((segment.endTime - segment.startTime) / duration) * 100}%`
        markerDiv.style.left = `${(segment.startTime / duration) * 100}%`

        markerBar.appendChild(markerDiv)
      })

      const seekBarContainer = document.querySelector('.shaka-seek-bar-container')
      seekBarContainer.insertBefore(markerBar, seekBarContainer.childNodes[0])
    },

    registerScreenshotButton: !process.env.IS_ELECTRON
      ? function () { }
      : function () {
        this.events.addEventListener('takeScreenshot', () => {
          this.takeScreenshot()
        })

        const events = this.events

        /**
         * @implements {shaka.extern.IUIElement.Factory}
         */
        class ScreenshotButtonFactory {
          create(rootElement, controls) {
            return new ScreenshotButton(events, rootElement, controls)
          }
        }

        shaka.ui.Controls.registerElement('ft_screenshot', new ScreenshotButtonFactory())
        shaka.ui.OverflowMenu.registerElement('ft_screenshot', new ScreenshotButtonFactory())
      },

    registerTheatreModeButton: function () {
      this.events.addEventListener('toggleTheatreMode', () => {
        this.$emit('toggle-theatre-mode')
      })

      const theatreModeEnabled = () => {
        return this.useTheatreMode
      }

      const events = this.events

      /**
       * @implements {shaka.extern.IUIElement.Factory}
       */
      class TheatreModeButtonFactory {
        create(rootElement, controls) {
          return new TheatreModeButton(theatreModeEnabled(), events, rootElement, controls)
        }
      }

      shaka.ui.Controls.registerElement('ft_theatre_mode', new TheatreModeButtonFactory())
      shaka.ui.OverflowMenu.registerElement('ft_theatre_mode', new TheatreModeButtonFactory())
    },

    registerFullWindowButton: function () {
      this.events.addEventListener('setFullWindow', event => {
        if (event.detail.enabled) {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        }

        this.fullWindowEnabled = event.detail.enabled

        if (this.fullWindowEnabled) {
          document.body.classList.add('playerFullWindow')
        } else {
          document.body.classList.remove('playerFullWindow')
        }
      })

      const fullWindowEnabled = () => {
        return this.fullWindowEnabled
      }

      const events = this.events

      /**
       * @implements {shaka.extern.IUIElement.Factory}
       */
      class FullWindowButtonFactory {
        create(rootElement, controls) {
          return new FullWindowButton(fullWindowEnabled(), events, rootElement, controls)
        }
      }

      shaka.ui.Controls.registerElement('ft_full_window', new FullWindowButtonFactory())
      shaka.ui.OverflowMenu.registerElement('ft_full_window', new FullWindowButtonFactory())
    },

    registerLegacyQualitySelection: function () {
      this.events.addEventListener('setLegacyFormat', async (event) => {
        const { format, playbackPosition, restoreCaptionIndex = null } = event.detail

        if (restoreCaptionIndex !== null) {
          this.restoreCaptionIndex = restoreCaptionIndex
        }

        this.activeLegacyFormat = event.detail.format
        try {
          await this.nonReactive.player.load(format.url, playbackPosition, format.mimeType)
        } catch (error) {
          this.handleError(error, 'setLegacyFormat', event.detail)
        }
      })

      const activeLegacyFormat = () => {
        return this.activeLegacyFormat
      }

      const events = this.events
      const legacyFormats = this.legacyFormats

      /**
       * @implements {shaka.extern.IUIElement.Factory}
       */
      class LegacyQualitySelectionFactory {
        create(rootElement, controls) {
          const format = activeLegacyFormat()
          return new LegacyQualitySelection(format, legacyFormats, events, rootElement, controls)
        }
      }

      shaka.ui.Controls.registerElement('ft_legacy_quality', new LegacyQualitySelectionFactory())
      shaka.ui.OverflowMenu.registerElement('ft_legacy_quality', new LegacyQualitySelectionFactory())
    },

    registerStatsButton: function () {
      this.events.addEventListener('setStatsVisibility', event => {
        this.showStats = event.detail

        if (this.showStats) {
          this.gatherInitialStatsValues()
        }
      })

      const showStats = () => {
        return this.showStats
      }

      const events = this.events

      /**
       * @implements {shaka.extern.IUIElement.Factory}
       */
      class StatsButtonFactory {
        create(rootElement, controls) {
          return new StatsButton(showStats(), events, rootElement, controls)
        }
      }

      shaka.ui.ContextMenu.registerElement('ft_stats', new StatsButtonFactory())
    },

    startPowerSaveBlocker: async function () {
      if (process.env.IS_ELECTRON && this.powerSaveBlocker === null) {
        const { ipcRenderer } = require('electron')
        this.powerSaveBlocker = await ipcRenderer.invoke(IpcChannels.START_POWER_SAVE_BLOCKER)
      }
    },

    stopPowerSaveBlocker: function () {
      if (process.env.IS_ELECTRON && this.powerSaveBlocker !== null) {
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.STOP_POWER_SAVE_BLOCKER, this.powerSaveBlocker)
        this.powerSaveBlocker = null
      }
    },

    /** @type {MediaSessionActionHandler} */
    mediaSessionActionHandler: function (details) {
      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      switch (details.action) {
        case 'play':
          video.play()
          break
        case 'pause':
          video.pause()
          break
        case 'seekbackward':
          video.currentTime -= (details.seekOffset || this.defaultSkipInterval)
          break
        case 'seekforward':
          video.currentTime += (details.seekOffset || this.defaultSkipInterval)
          break
        case 'seekto': {
          const { start: seekRangeStart } = this.nonReactive.player.seekRange()

          if (details.fastSeek) {
            video.fastSeek(seekRangeStart + details.seekTime)
          } else {
            video.currentTime = seekRangeStart + details.seekTime
          }
          break
        }
      }
    },

    /**
     * @param {number|Event} currentTime
     */
    updateMediaSessionPositionState: function (currentTime) {
      if (this.hasLoaded && 'mediaSession' in navigator) {
        const seekRange = this.nonReactive.player.seekRange()

        if (typeof currentTime !== 'number') {
          currentTime = this.$refs.video.currentTime
        }

        const duration = seekRange.end - seekRange.start

        const playbackRate = this.$refs.video.playbackRate

        navigator.mediaSession.setPositionState({
          duration,
          position: Math.min(Math.max(0, currentTime - seekRange.start), duration),
          playbackRate: playbackRate > 0 ? playbackRate : undefined
        })
      }
    },

    /**
     * @param {KeyboardEvent} event
     */
    keyboardShortcutHandler: function (event) {
      const player = this.nonReactive.player
      if (!player || !this.hasLoaded) {
        return
      }

      if (document.activeElement.classList.contains('ft-input') || event.altKey) {
        return
      }

      // allow chapter jump keyboard shortcuts
      if (event.ctrlKey && (process.platform === 'darwin' || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight'))) {
        return
      }

      // allow copying text
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        return
      }

      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      const ui = this.nonReactive.ui

      switch (event.key) {
        case ' ':
        case 'Spacebar': // older browsers might return spacebar instead of a space character
        case 'K':
        case 'k':
          // Toggle Play/Pause
          event.preventDefault()
          video.paused ? video.play() : video.pause()
          break
        case 'J':
        case 'j':
          // Rewind by 2x the time-skip interval (in seconds)
          event.preventDefault()
          this.seekBySeconds(-this.defaultSkipInterval * video.playbackRate * 2)
          break
        case 'L':
        case 'l':
          // Fast-Forward by 2x the time-skip interval (in seconds)
          event.preventDefault()
          this.seekBySeconds(this.defaultSkipInterval * video.playbackRate * 2)
          break
        case 'O':
        case 'o':
          // Decrease playback rate by user configured interval
          event.preventDefault()
          this.changePlayBackRate(-this.videoPlaybackRateInterval)
          break
        case 'P':
        case 'p':
          // Increase playback rate by user configured interval
          event.preventDefault()
          this.changePlayBackRate(this.videoPlaybackRateInterval)
          break
        case 'F':
        case 'f':
          // Toggle full screen
          event.preventDefault()
          ui.getControls().toggleFullScreen()
          break
        case 'M':
        case 'm':
          // Toggle mute
          event.preventDefault()
          video.muted = !video.muted
          break
        case 'C':
        case 'c':
          // Toggle caption/subtitles
          if (player.getTextTracks().length > 0) {
            event.preventDefault()

            const currentlyVisible = player.isTextTrackVisible()
            player.setTextTrackVisibility(!currentlyVisible)
          }
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
            video.currentTime = this.chapters[this.currentChapterIndex - 1].startSeconds
          } else {
            // Rewind by the time-skip interval (in seconds)
            this.seekBySeconds(-this.defaultSkipInterval * video.playbackRate)
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (this.canChapterJump(event, 'next')) {
            // Jump to the next chapter
            video.currentTime = (this.chapters[this.currentChapterIndex + 1].startSeconds)
          } else {
            // Fast-Forward by the time-skip interval (in seconds)
            this.seekBySeconds(this.defaultSkipInterval * video.playbackRate)
          }
          break
        case 'I':
        case 'i':
          // Toggle picture in picture
          if (this.format !== 'audio') {
            const controls = ui.getControls()
            if (controls.isPiPAllowed()) {
              controls.togglePiP()
            }
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
          if (this.canSeek()) {
            event.preventDefault()

            // use seek range instead of duration so that it works for live streams too
            const seekRange = player.seekRange()

            const length = seekRange.end - seekRange.start
            const percentage = parseInt(event.key) / 10

            video.currentTime = seekRange.start + (length * percentage)
          }
          break
        }
        case ',':
          event.preventDefault()
          // Return to previous frame
          this.frameByFrame(-1)
          break
        case '.':
          event.preventDefault()
          // Advance to next frame
          this.frameByFrame(1)
          break
        case 'D':
        case 'd':
          // Toggle stats display
          event.preventDefault()

          this.events.dispatchEvent(new CustomEvent('setStatsVisibility', {
            detail: !this.showStats
          }))
          break
        case 'Escape':
          // Exit full window
          if (this.fullWindowEnabled) {
            event.preventDefault()

            this.events.dispatchEvent(new CustomEvent('setFullWindow', {
              detail: {
                enabled: false
              }
            }))
          }
          break
        case 'S':
        case 's':
          // Toggle full window mode
          event.preventDefault()
          this.events.dispatchEvent(new CustomEvent('setFullWindow', {
            detail: {
              enabled: !this.fullWindowEnabled
            }
          }))
          break
        case 'T':
        case 't':
          // Toggle theatre mode
          if (this.theatrePossible) {
            event.preventDefault()

            this.events.dispatchEvent(new CustomEvent('toggleTheatreMode', {
              detail: {
                enabled: !this.useTheatreMode
              }
            }))
          }
          break
        case 'U':
        case 'u':
          if (process.env.IS_ELECTRON && this.enableScreenshot && this.format !== 'audio') {
            event.preventDefault()
            // Take screenshot
            this.takeScreenshot()
          }
          break
      }
    },

    // functions used by the watch page

    isPaused: function () {
      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      return video.paused
    },

    pause: function () {
      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      video.pause()
    },

    getCurrentTime: function () {
      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      return video.currentTime
    },

    /**
     * @param {number} value
     */
    setCurrentTime: function (value) {
      /** @type {HTMLVideoElement} */
      const video = this.$refs.video

      video.currentTime = value
    },

    ...mapActions([
      'cachePlayerLocale',
      'parseScreenshotCustomFileName',
      'updateScreenshotFolderPath',
    ])
  }
})
