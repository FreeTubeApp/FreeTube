import fs from 'fs/promises'
import path from 'path'

import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import shaka from 'shaka-player'

import store from '../../store/index'
import i18n from '../../i18n/index'

import { IpcChannels } from '../../../constants'
import { AudioTrackSelection } from './player-components/AudioTrackSelection'
import { FullWindowButton } from './player-components/FullWindowButton'
import { LegacyQualitySelection } from './player-components/LegacyQualitySelection'
import { ScreenshotButton } from './player-components/ScreenshotButton'
import { StatsButton } from './player-components/StatsButton'
import { TheatreModeButton } from './player-components/TheatreModeButton'
import {
  findMostSimilarAudioBandwidth,
  getSponsorBlockSegments,
  logShakaError,
  qualityLabelToDimension,
  repairInvidiousManifest,
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
const AdvancedRequestType = shaka.net.NetworkingEngine.AdvancedRequestType
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
  setup: function (props, { emit, expose }) {
    /** @type {shaka.Player|null} */
    let player = null

    /** @type {shaka.ui.Overlay|null} */
    let ui = null

    const events = new EventTarget()

    /** @type {import('vue').Ref<HTMLDivElement | null>} */
    const container = ref(null)

    /** @type {import('vue').Ref<HTMLVideoElement | null>} */
    const video = ref(null)

    /** @type {import('vue').Ref<HTMLCanvasElement | null>} */
    const vrCanvas = ref(null)

    const hasLoaded = ref(false)

    const hasMultipleAudioTracks = ref(false)
    const isLive = ref(false)

    const useOverFlowMenu = ref(false)
    const fullWindowEnabled = ref(false)
    const forceAspectRatio = ref(false)

    const activeLegacyFormat = shallowRef(null)

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
    if (props.captions.length > 1) {
      // theoretically we would resort when the language changes, but we can't remove captions that we already added to the player
      sortedCaptions = sortCaptions(props.captions)
    } else if (props.captions.length === 1) {
      sortedCaptions = props.captions
    } else {
      sortedCaptions = []
    }

    /** @type {number|null} */
    let restoreCaptionIndex = null

    if (store.getters.getEnableSubtitlesByDefault && sortedCaptions.length > 0) {
      restoreCaptionIndex = 0
    }

    const showStats = ref(false)
    const stats = reactive({
      resolution: {
        width: 0,
        height: 0,
        frameRate: 0
      },
      playerDimensions: {
        width: 0,
        height: 0
      },
      bitrate: '0',
      volume: '100',
      bandwidth: '0',
      buffered: '0',
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
    })

    // #region settings

    /** @type {import('vue').ComputedRef<boolean>} */
    const autoplayVideos = computed(() => {
      return store.getters.getAutoplayVideos
    })

    /** @type {import('vue').ComputedRef<boolean>} */
    const displayVideoPlayButton = computed(() => {
      return store.getters.getDisplayVideoPlayButton
    })

    watch(displayVideoPlayButton, (newValue) => {
      ui.configure({
        addBigPlayButton: newValue
      })
    })

    /** @type {import('vue').ComputedRef<number>} */
    const defaultPlayback = computed(() => {
      return store.getters.getDefaultPlayback
    })

    /** @type {import('vue').ComputedRef<number>} */
    const defaultSkipInterval = computed(() => {
      return store.getters.getDefaultSkipInterval
    })

    /** @type {import('vue').ComputedRef<number | 'auto'>} */
    const defaultQuality = computed(() => {
      const value = store.getters.getDefaultQuality
      if (value === 'auto') { return value }

      return parseInt(value)
    })

    /** @type {import('vue').ComputedRef<boolean>} */
    const enterFullscreenOnDisplayRotate = computed(() => {
      return store.getters.getEnterFullscreenOnDisplayRotate
    })

    watch(enterFullscreenOnDisplayRotate, (newValue) => {
      ui.configure({
        enableFullscreenOnRotation: newValue
      })
    })

    const maxVideoPlaybackRate = computed(() => {
      return parseInt(store.getters.getMaxVideoPlaybackRate)
    })

    const videoPlaybackRateInterval = computed(() => {
      return parseFloat(store.getters.getVideoPlaybackRateInterval)
    })

    const playbackRates = computed(() => {
      const interval = videoPlaybackRateInterval.value
      const playbackRates = []
      let i = interval

      while (i <= maxVideoPlaybackRate.value) {
        playbackRates.unshift(i)
        i += interval
        i = parseFloat(i.toFixed(2))
      }

      return playbackRates
    })

    watch(playbackRates, (newValue) => {
      ui.configure({
        playbackRates: newValue
      })
    })

    /** @type {import('vue').ComputedRef<boolean>} */
    const enableScreenshot = computed(() => {
      return store.getters.getEnableScreenshot
    })

    /** @type {import('vue').ComputedRef<string>} */
    const screenshotFormat = computed(() => {
      return store.getters.getScreenshotFormat
    })

    /** @type {import('vue').ComputedRef<number>} */
    const screenshotQuality = computed(() => {
      return store.getters.getScreenshotQuality
    })

    /** @type {import('vue').ComputedRef<boolean>} */
    const screenshotAskPath = computed(() => {
      return store.getters.getScreenshotAskPath
    })

    /** @type {import('vue').ComputedRef<string>} */
    const screenshotFolder = computed(() => {
      return store.getters.getScreenshotFolderPath
    })

    /** @type {import('vue').ComputedRef<boolean>} */
    const videoVolumeMouseScroll = computed(() => {
      return store.getters.getVideoVolumeMouseScroll
    })

    /** @type {import('vue').ComputedRef<boolean>} */
    const videoPlaybackRateMouseScroll = computed(() => {
      return store.getters.getVideoPlaybackRateMouseScroll
    })

    /** @type {import('vue').ComputedRef<boolean>} */
    const videoSkipMouseScroll = computed(() => {
      return store.getters.getVideoSkipMouseScroll
    })

    /** @type {import('vue').ComputedRef<boolean>} */
    const useSponsorBlock = computed(() => {
      return store.getters.getUseSponsorBlock
    })

    /** @type {import('vue').ComputedRef<boolean>} */
    const sponsorBlockShowSkippedToast = computed(() => {
      return store.getters.getSponsorBlockShowSkippedToast
    })

    const sponsorSkips = computed(() => {
      // save some work when sponsorblock is disabled
      if (!useSponsorBlock.value) {
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
            sponsorVal = store.getters.getSponsorBlockSponsor
            break
          case 'selfpromo':
            sponsorVal = store.getters.getSponsorBlockSelfPromo
            break
          case 'interaction':
            sponsorVal = store.getters.getSponsorBlockInteraction
            break
          case 'intro':
            sponsorVal = store.getters.getSponsorBlockIntro
            break
          case 'outro':
            sponsorVal = store.getters.getSponsorBlockOutro
            break
          case 'preview':
            sponsorVal = store.getters.getSponsorBlockRecap
            break
          case 'music_offtopic':
            sponsorVal = store.getters.getSponsorBlockMusicOffTopic
            break
          case 'filler':
            sponsorVal = store.getters.getSponsorBlockFiller
            break
        }

        if (sponsorVal.skip !== 'doNothing') {
          seekBar.push(x)
        }

        if (sponsorVal.skip === 'autoSkip') {
          autoSkip.add(x)
        }

        if (sponsorVal.skip === 'promptToSkip') {
          promptSkip.add(x)
        }

        categoryData[x] = sponsorVal
      })
      return { autoSkip, seekBar, promptSkip, categoryData }
    })

    // #endregion settings

    // #region SponsorBlock

    /**
     * @type {{
     *   uuid: string
     *   category: SponsorBlockCategory
     *   startTime: number,
     *   endTime: number
     * }[]}
     */
    let sponsorBlockSegments = []
    let sponsorBlockAverageVideoDuration = 0

    /**
     * Yes a map would be much more suitable for this (unlike objects they retain the order that items were inserted),
     * but Vue 2 doesn't support reactivity on Maps, so we have to use an array instead
     * @type {import('vue').Ref<{uuid: string, translatedCategory: string, timeoutId: number}[]>}
     */
    const skippedSponsorBlockSegments = ref([])

    async function setupSponsorBlock() {
      let segments, averageDuration

      try {
        ({ segments, averageDuration } = await getSponsorBlockSegments(props.videoId, sponsorSkips.value.seekBar))
      } catch (e) {
        console.error(e)
        segments = []
      }

      // check if the component is already getting destroyed
      // which is possible because this function runs asynchronously
      if (!ui || !player) {
        return
      }

      if (segments.length > 0) {
        sponsorBlockSegments = segments
        sponsorBlockAverageVideoDuration = averageDuration

        createSponsorBlockMarkers(averageDuration)
      }
    }

    /**
     * @param {number} currentTime
     */
    function skipSponsorBlockSegments(currentTime) {
      const { autoSkip } = sponsorSkips.value

      if (autoSkip.size === 0) {
        return
      }

      const video_ = video.value

      let newTime = 0
      const skippedSegments = []

      sponsorBlockSegments.forEach(segment => {
        if (autoSkip.has(segment.category) && currentTime < segment.endTime &&
          (segment.startTime <= currentTime ||
            // if we already have a segment to skip, check if there are any that are less than 150ms later,
            // so that we can skip them all in one go (especially useful on slow connections)
            (newTime > 0 && (segment.startTime < newTime || segment.startTime - newTime <= 0.150) && segment.endTime > newTime))) {
          newTime = segment.endTime
          skippedSegments.push(segment)
        }
      })

      if (newTime === 0 || video_.ended) {
        return
      }

      const videoEnd = player.seekRange().end

      if (Math.abs(videoEnd - currentTime) < 1 || video_.ended) {
        return
      }

      if (newTime > videoEnd || Math.abs(videoEnd - newTime) < 1) {
        newTime = videoEnd
      }

      video_.currentTime = newTime

      if (sponsorBlockShowSkippedToast.value) {
        skippedSegments.forEach(({ uuid, category }) => {
          // if the element already exists, just update the timeout, instead of creating a duplicate
          // can happen at the end of the video sometimes
          const existingSkip = skippedSponsorBlockSegments.value.find(skipped => skipped.uuid === uuid)
          if (existingSkip) {
            clearTimeout(existingSkip.timeoutId)

            existingSkip.timeoutId = setTimeout(() => {
              const index = skippedSponsorBlockSegments.value.findIndex(skipped => skipped.uuid === uuid)
              skippedSponsorBlockSegments.value.splice(index, 1)
            }, 2000)
          } else {
            skippedSponsorBlockSegments.value.push({
              uuid,
              translatedCategory: translateSponsorBlockCategory(category),
              timeoutId: setTimeout(() => {
                const index = skippedSponsorBlockSegments.value.findIndex(skipped => skipped.uuid === uuid)
                skippedSponsorBlockSegments.value.splice(index, 1)
              }, 2000)
            })
          }
        })
      }
    }

    // #endregion SponsorBlock

    // #region player config

    const seekingIsPossible = computed(() => {
      if (props.manifestMimeType !== 'application/x-mpegurl') {
        return true
      }

      const match = props.manifestSrc.match(/\/(?:manifest|playlist)_duration\/(\d+)\//)

      // Check how many seconds we are allowed to seek, 30 is too short, 3600 is an hour which is great
      return match != null && parseInt(match[1] || '0') > 30
    })

    /**
     * @param {'dash'|'audio'|'legacy'} format
     * @param {boolean} useAutoQuality
     * @returns {shaka.extern.PlayerConfiguration}
     **/
    function getPlayerConfig(format, useAutoQuality = false) {
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
            manifestPreprocessorTXml: manifestPreprocessorTXml
          },
          availabilityWindowOverride: seekingIsPossible.value ? NaN : 0
        },
        abr: {
          enabled: useAutoQuality,

          // This only affects the "auto" quality, users can still manually select whatever quality they want.
          restrictToElementSize: true
        },
        autoShowText: shaka.config.AutoShowText.NEVER,

        // Only use variants that are predicted to play smoothly
        // https://developer.mozilla.org/en-US/docs/Web/API/MediaCapabilities/decodingInfo
        preferredDecodingAttributes: format === 'dash' ? ['smooth'] : [],

        // Electron doesn't like YouTube's vp9 VR video streams and throws:
        // "CHUNK_DEMUXER_ERROR_APPEND_FAILED: Projection element is incomplete; ProjectionPoseYaw required."
        // So use the AV1 and h264 codecs instead which it doesn't reject
        preferredVideoCodecs: typeof props.vrProjection === 'string' ? ['av01', 'avc1'] : []
      }
    }

    /**
     * @param {shaka.extern.xml.Node} mpdNode
     */
    function manifestPreprocessorTXml(mpdNode) {
      /** @type {shaka.extern.xml.Node[]} */
      const periods = mpdNode.children?.filter(child => typeof child !== 'string' && child.tagName === 'Period') ?? []

      sortAdapationSetsByCodec(periods)

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
      } else if (!process.env.SUPPORTS_LOCAL_API) {
        repairInvidiousManifest(periods)
      }
    }

    /**
     * @param {shaka.extern.xml.Node[]} periods
     */
    function sortAdapationSetsByCodec(periods) {
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
    }

    // #endregion player config

    // #region UI config

    const useVrMode = computed(() => {
      return props.format === 'dash' && props.vrProjection === 'EQUIRECTANGULAR'
    })

    const uiConfig = computed(() => {
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
        trackLabelFormat: hasMultipleAudioTracks.value ? TrackLabelFormat.LABEL : TrackLabelFormat.LANGUAGE,
        // Only set it to label if we added the captions ourselves,
        // some live streams come with subtitles in the DASH manifest, but without labels
        textTrackLabelFormat: sortedCaptions.length > 0 ? TrackLabelFormat.LABEL : TrackLabelFormat.LANGUAGE,
        displayInVrMode: useVrMode.value
      }

      /** @type {string[]} */
      let elementList = []

      if (useOverFlowMenu.value) {
        uiConfig.overflowMenuButtons = [
          'ft_screenshot',
          'playback_rate',
          'loop',
          'ft_audio_tracks',
          'captions',
          'picture_in_picture',
          'ft_full_window',
          props.format === 'legacy' ? 'ft_legacy_quality' : 'quality',
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
          'ft_audio_tracks',
          'captions',
          'picture_in_picture',
          'ft_theatre_mode',
          'ft_full_window',
          props.format === 'legacy' ? 'ft_legacy_quality' : 'quality'
        )

        elementList = uiConfig.controlPanelElements
      }

      uiConfig.controlPanelElements.push('fullscreen')

      if (!process.env.IS_ELECTRON || !enableScreenshot.value || props.format === 'audio') {
        const index = elementList.indexOf('ft_screenshot')
        elementList.splice(index, 1)
      }

      if (!props.theatrePossible) {
        const index = elementList.indexOf('ft_theatre_mode')
        // doesn't exist in overflow menu, as theatre mode only works on wide screens
        if (index !== -1) {
          elementList.splice(index, 1)
        }
      }

      if (props.format === 'audio') {
        const index = elementList.indexOf('picture_in_picture')
        elementList.splice(index, 1)
      }

      if (isLive.value) {
        const index = elementList.indexOf('loop')
        elementList.splice(index, 1)
      }

      if (!useVrMode.value) {
        const indexRecenterVr = elementList.indexOf('recenter_vr')
        elementList.splice(indexRecenterVr, 1)

        const indexToggleStereoscopic = elementList.indexOf('toggle_stereoscopic')
        elementList.splice(indexToggleStereoscopic, 1)
      }

      return uiConfig
    })

    /**
     * For the first call we want to set initial values for options that may change later,
     * as well as setting the options that we won't change again.
     *
     * For all subsequent calls we only want to reconfigure the options that have changed.
     * e.g. due to the active format changing or the user changing settings
     * @param {boolean} firstTime
     */
    function configureUI(firstTime = false) {
      if (firstTime) {
        const firstTimeConfig = {
          addSeekBar: seekingIsPossible.value,
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
          addBigPlayButton: displayVideoPlayButton.value,
          enableFullscreenOnRotation: enterFullscreenOnDisplayRotate.value,
          playbackRates: playbackRates.value,

          // we have our own ones (shaka-player's ones are quite limited)
          enableKeyboardPlaybackControls: false,

          // TODO: enable this when electron gets document PiP support
          // https://github.com/electron/electron/issues/39633
          preferDocumentPictureInPicture: false
        }

        // Combine the config objects so we only need to do one configure call
        // as shaka-player recreates the UI when you call configure
        Object.assign(firstTimeConfig, uiConfig.value)

        ui.configure(firstTimeConfig)
      } else {
        ui.configure(uiConfig.value)
      }
    }

    /**
     * @param {WheelEvent} event
     */
    function handleControlsContainerWheel(event) {
      /** @type {DOMTokenList} */
      const classList = event.target.classList

      if (classList.contains('shaka-scrim-container') ||
        classList.contains('shaka-fast-foward-container') ||
        classList.contains('shaka-rewind-container') ||
        classList.contains('shaka-play-button-container') ||
        classList.contains('shaka-play-button')) {
        //

        if (event.ctrlKey || event.metaKey) {
          if (videoPlaybackRateMouseScroll.value) {
            mouseScrollPlaybackRate(event)
          }
        } else {
          if (videoVolumeMouseScroll.value) {
            mouseScrollVolume(event)
          } else if (videoSkipMouseScroll.value) {
            mouseScrollSkip(event)
          }
        }
      }
    }

    /**
     * @param {MouseEvent} event
     */
    function handleControlsContainerClick(event) {
      if (event.ctrlKey || event.metaKey) {
        // stop shaka-player's click handler firing
        event.stopPropagation()

        video.value.playbackRate = defaultPlayback.value
        video.value.defaultPlaybackRate = defaultPlayback.value
      }
    }

    function addUICustomizations() {
      /** @type {HTMLDivElement} */
      const controlsContainer = ui.getControls().getControlsContainer()

      controlsContainer.removeEventListener('wheel', handleControlsContainerWheel)
      controlsContainer.removeEventListener('click', handleControlsContainerClick, true)

      if (!useVrMode.value) {
        if (videoVolumeMouseScroll.value || videoSkipMouseScroll.value || videoPlaybackRateMouseScroll.value) {
          controlsContainer.addEventListener('wheel', handleControlsContainerWheel)
        }

        if (videoPlaybackRateMouseScroll.value) {
          controlsContainer.addEventListener('click', handleControlsContainerClick, true)
        }
      }

      // make scrolling over volume slider change the volume
      container.value.querySelector('.shaka-volume-bar').addEventListener('wheel', mouseScrollVolume)

      // title overlay when the video is fullscreened
      // placing this inside the controls container so that we can fade it in and out at the same time as the controls
      const fullscreenTitleOverlay = document.createElement('h1')
      fullscreenTitleOverlay.textContent = props.title
      fullscreenTitleOverlay.className = 'playerFullscreenTitleOverlay'
      controlsContainer.appendChild(fullscreenTitleOverlay)

      if (hasLoaded.value && props.chapters.length > 0) {
        createChapterMarkers()
      }

      if (useSponsorBlock.value && sponsorBlockSegments.length > 0) {
        let duration
        if (hasLoaded.value) {
          const seekRange = player.seekRange()

          duration = seekRange.end - seekRange.start
        } else {
          duration = sponsorBlockAverageVideoDuration
        }

        createSponsorBlockMarkers(duration)
      }
    }

    watch(uiConfig, (newValue, oldValue) => {
      if (newValue !== oldValue && ui) {
        configureUI()
      }
    })

    watch(videoVolumeMouseScroll, (newValue, oldValue) => {
      if (newValue !== oldValue && ui) {
        configureUI()
      }
    })

    watch(videoPlaybackRateMouseScroll, (newValue, oldValue) => {
      if (newValue !== oldValue && ui) {
        configureUI()
      }
    })

    watch(videoSkipMouseScroll, (newValue, oldValue) => {
      if (newValue !== oldValue && ui) {
        configureUI()
      }
    })

    /** @type {ResizeObserver|null} */
    let resizeObserver = null

    /** @type {ResizeObserverCallback} */
    function resized(entries) {
      useOverFlowMenu.value = entries[0].contentBoxSize[0].inlineSize <= USE_OVERFLOW_MENU_WIDTH_THRESHOLD
    }

    // #endregion UI config

    // #region player locales

    // shaka-player ships with some locales prebundled and already loaded
    const loadedLocales = new Set(process.env.SHAKA_LOCALES_PREBUNDLED)

    /**
     * @param {string} locale
     */
    async function setLocale(locale) {
      // For most of FreeTube's locales their is an equivalent one in shaka-player,
      // however if there isn't one we should fall back to US English.
      // At the time of writing "et", "eu", "gl", "is" don't have any translations
      const shakaLocale = LOCALE_MAPPINGS.get(locale) ?? 'en'

      const localization = ui.getControls().getLocalization()

      const cachedLocales = store.state.player.cachedPlayerLocales

      if (!loadedLocales.has(shakaLocale)) {
        if (!Object.hasOwn(cachedLocales, shakaLocale)) {
          await store.dispatch('cachePlayerLocale', shakaLocale)
        }

        localization.insert(shakaLocale, new Map(Object.entries(cachedLocales[shakaLocale])))

        loadedLocales.add(shakaLocale)
      }

      localization.changeLocale([shakaLocale])

      events.dispatchEvent(new CustomEvent('localeChanged'))
    }

    watch(() => i18n.locale, setLocale)

    // #endregion player locales

    // #region power save blocker

    let powerSaveBlocker = null

    async function startPowerSaveBlocker() {
      if (process.env.IS_ELECTRON && powerSaveBlocker === null) {
        const { ipcRenderer } = require('electron')
        powerSaveBlocker = await ipcRenderer.invoke(IpcChannels.START_POWER_SAVE_BLOCKER)
      }
    }

    function stopPowerSaveBlocker() {
      if (process.env.IS_ELECTRON && powerSaveBlocker !== null) {
        const { ipcRenderer } = require('electron')
        ipcRenderer.send(IpcChannels.STOP_POWER_SAVE_BLOCKER, powerSaveBlocker)
        powerSaveBlocker = null
      }
    }

    // #endregion power save blocker

    // #region video event handlers

    function handlePlay() {
      startPowerSaveBlocker()

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
    }

    function handlePause() {
      stopPowerSaveBlocker()

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused'
      }
    }

    function handleEnded() {
      stopPowerSaveBlocker()

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none'
      }

      emit('ended')
    }

    function updateVolume() {
      const video_ = video.value
      // https://docs.videojs.com/html5#volume
      if (sessionStorage.getItem('muted') === 'false' && video_.volume === 0) {
        // If video is muted by dragging volume slider, it doesn't change 'muted' in sessionStorage to true
        // hence compare it with 'false' and set volume to defaultVolume.
        const volume = parseFloat(sessionStorage.getItem('defaultVolume'))
        const muted = true
        sessionStorage.setItem('volume', volume.toString())
        sessionStorage.setItem('muted', String(muted))
      } else {
        // If volume isn't muted by dragging the slider, muted and volume values are carried over to next video.
        const volume = video_.volume
        const muted = video_.muted
        sessionStorage.setItem('volume', volume.toString())
        sessionStorage.setItem('muted', String(muted))
      }

      if (showStats.value) {
        stats.volume = (video_.volume * 100).toFixed(1)
      }
    }

    function handleTimeupdate() {
      const currentTime = video.value.currentTime

      emit('timeupdate', currentTime)

      if (showStats.value && hasLoaded.value) {
        updateStats()
      }

      if (useSponsorBlock.value && sponsorBlockSegments.length > 0 && canSeek()) {
        skipSponsorBlockSegments(currentTime)
      }
    }

    // #endregion video event handlers

    // #region request/response filters

    /** @type {shaka.extern.RequestFilter} */
    function requestFilter(type, request, _context) {
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
    }

    /**
     * Handles Application Level Redirects
     * Based on the example in the YouTube.js repository
     * @type {shaka.extern.ResponseFilter}
     */
    async function responseFilter(type, response, context) {
      if (type === RequestType.SEGMENT) {
        if (response.data && response.data.byteLength > 4 &&
          new DataView(response.data).getUint32(0) === HTTP_IN_HEX) {
          // Interpret the response data as a URL string.
          const responseAsString = shaka.util.StringUtils.fromUTF8(response.data)

          const retryParameters = player.getConfiguration().streaming.retryParameters

          // Make another request for the redirect URL.
          const uris = [responseAsString]
          const redirectRequest = shaka.net.NetworkingEngine.makeRequest(uris, retryParameters)
          const requestOperation = player.getNetworkingEngine().request(type, redirectRequest, context)
          const redirectResponse = await requestOperation.promise

          // Modify the original response to contain the results of the redirect
          // response.
          response.data = redirectResponse.data
          response.headers = redirectResponse.headers
          response.uri = redirectResponse.uri
        } else {
          const url = new URL(response.uri)

          // Fix positioning for auto-generated subtitles
          if (url.hostname.endsWith('.youtube.com') && url.pathname === '/api/timedtext' &&
            url.searchParams.get('caps') === 'asr' && url.searchParams.get('kind') === 'asr' && url.searchParams.get('fmt') === 'vtt') {
            const stringBody = new TextDecoder().decode(response.data)
            const cleaned = stringBody.replaceAll(/ align:start position:0%$/gm, '')

            response.data = new TextEncoder().encode(cleaned).buffer
          }
        }
      } else if (type === RequestType.MANIFEST && context.type === AdvancedRequestType.MEDIA_PLAYLIST) {
        const url = new URL(response.uri)

        let modifiedText

        // Fixes proxied HLS manifests, as Invidious replaces the path parameters with query parameters,
        // so shaka-player isn't able to infer the mime type from the `/file/seg.ts` part like it does for non-proxied HLS manifests.
        // Shaka-player does attempt to detect it with HEAD request but the `Content-Type` header is `application/octet-stream`,
        // which still doesn't tell shaka-player how to handle the stream because that's the equivalent of saying "binary data".
        if (url.searchParams.has('local')) {
          const stringBody = new TextDecoder().decode(response.data)

          modifiedText = stringBody.replaceAll(/https?:\/\/.+$/gm, hlsProxiedUrlReplacer)
        }

        // The audio-only streams are actually raw AAC, so correct the file extension from `.ts` to `.aac`
        if (/\/itag\/23[34]\//.test(url.pathname) || url.searchParams.get('itag') === '233' || url.searchParams.get('itag') === '234') {
          if (!modifiedText) {
            modifiedText = new TextDecoder().decode(response.data)
          }

          modifiedText = modifiedText.replaceAll('/file/seg.ts', '/file/seg.aac')
        }

        if (modifiedText) {
          response.data = new TextEncoder().encode(modifiedText).buffer
        }
      }
    }

    /**
     * @param {string} match
     */
    function hlsProxiedUrlReplacer(match) {
      const url = new URL(match)

      let fileValue
      for (const [key, value] of url.searchParams) {
        if (key === 'file') {
          fileValue = value
          continue
        } else if (key === 'hls_chunk_host') {
          // Add the host parameter so some Invidious instances stop complaining about the missing host parameter
          // Replace .c.youtube.com with .googlevideo.com as the built-in Invidious video proxy only accepts host parameters with googlevideo.com
          url.pathname += `/host/${encodeURIComponent(value.replace('.c.youtube.com', '.googlevideo.com'))}`
        }

        url.pathname += `/${key}/${encodeURIComponent(value)}`
      }

      // This has to be right at the end so that shaka-player can read the file extension
      url.pathname += `/file/${encodeURIComponent(fileValue)}`

      url.search = ''
      return url.toString()
    }

    // #endregion request/response filters

    // #region set quality

    /**
     * @param {number} quality
     * @param {number | undefined} audioBandwidth
     * @param {string | undefined} label
     */
    function setDashQuality(quality, audioBandwidth, label) {
      let variants = player.getVariantTracks()

      if (label) {
        variants = variants.filter(variant => variant.label === label)
      } else if (hasMultipleAudioTracks.value) {
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

      let chosenVariant

      if (typeof audioBandwidth === 'number') {
        const width = matches[0].width
        const height = matches[0].height

        matches = matches.filter(variant => variant.width === width && variant.height === height)

        chosenVariant = findMostSimilarAudioBandwidth(matches, audioBandwidth)
      } else {
        chosenVariant = matches[0]
      }

      player.selectVariantTrack(chosenVariant)
    }

    /**
     * @param {'dash'|'audio'|null} previousFormat
     * @param {number|null} playbackPosition
     */
    async function setLegacyQuality(previousFormat = null, playbackPosition = null) {
      /** @type {object[]} */
      const legacyFormats = props.legacyFormats

      // TODO: switch to using height and width when Invidious starts returning them, instead of parsing the quality label

      let previousQuality
      if (previousFormat === 'dash') {
        const previousTrack = player.getVariantTracks().find(track => track.active)

        previousQuality = previousTrack.height > previousTrack.width ? previousTrack.width : previousTrack.height
      } else if (defaultQuality.value === 'auto') {
        previousQuality = Infinity
      } else {
        previousQuality = defaultQuality.value
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

      hasMultipleAudioTracks.value = false

      events.dispatchEvent(new CustomEvent('setLegacyFormat', {
        detail: {
          format: matches[0],
          playbackPosition
        }
      }))
    }

    // #endregion set quality

    // #region stats

    function gatherInitialStatsValues() {
      /** @type {HTMLVideoElement} */
      const video_ = video.value

      stats.volume = (video_.volume * 100).toFixed(1)

      if (props.format === 'legacy') {
        updateLegacyQualityStats(activeLegacyFormat.value)
      }

      const playerDimensions = video_.getBoundingClientRect()
      stats.playerDimensions = {
        width: Math.floor(playerDimensions.width),
        height: Math.floor(playerDimensions.height)
      }

      if (!hasLoaded.value) {
        player.addEventListener('loaded', () => {
          if (showStats.value) {
            if (props.format !== 'legacy') {
              updateQualityStats({
                newTrack: player.getVariantTracks().find(track => track.active)
              })
            }

            updateStats()
          }
        }, {
          once: true
        })

        return
      }

      if (props.format !== 'legacy') {
        updateQualityStats({
          newTrack: player.getVariantTracks().find(track => track.active)
        })
      }

      updateStats()
    }

    /**
     * @param {{
     *   type: ('adaptation'|'variantchanged'),
     *   newTrack: shaka.extern.Track,
     *   oldTrack: shaka.extern.Track
     * }} track
     */
    function updateQualityStats({ newTrack }) {
      if (!showStats.value || props.format === 'legacy') {
        return
      }

      stats.bitrate = (newTrack.bandwidth / 1000).toFixed(2)

      // Combined audio and video HLS streams
      if (newTrack.videoCodec?.includes(',')) {
        stats.codecs.audioItag = ''
        stats.codecs.videoItag = ''

        const [audioCodec, videoCodec] = newTrack.videoCodec.split(',')

        stats.codecs.audioCodec = audioCodec
        stats.codecs.videoCodec = videoCodec

        stats.resolution.frameRate = newTrack.frameRate
        stats.resolution.width = newTrack.width
        stats.resolution.height = newTrack.height
      } else {
        // for videos with multiple audio tracks, youtube.js appends the track id to the itag, to make it unique
        stats.codecs.audioItag = newTrack.originalAudioId.split('-')[0]
        stats.codecs.audioCodec = newTrack.audioCodec

        if (props.format === 'dash') {
          stats.resolution.frameRate = newTrack.frameRate

          stats.codecs.videoItag = newTrack.originalVideoId
          stats.codecs.videoCodec = newTrack.videoCodec

          stats.resolution.width = newTrack.width
          stats.resolution.height = newTrack.height
        }
      }
    }

    function updateLegacyQualityStats(newFormat) {
      if (!showStats.value || props.format !== 'legacy') {
        return
      }

      const { fps, bitrate, mimeType, itag, width, height } = newFormat

      const codecsMatch = mimeType.match(/codecs="(?<videoCodec>.+), ?(?<audioCodec>.+)"/)

      stats.codecs.audioItag = itag
      stats.codecs.audioCodec = codecsMatch.groups.audioCodec

      stats.codecs.videoItag = itag
      stats.codecs.videoCodec = codecsMatch.groups.videoCodec

      stats.resolution.frameRate = fps

      stats.bitrate = (bitrate / 1000).toFixed(2)

      if (typeof width === 'undefined' || typeof height === 'undefined') {
        // Invidious doesn't provide any height or width information for their legacy formats, so lets read it from the video instead
        // they have a size property but it's hard-coded, so it reports false information for shorts for example
        const video_ = video.value

        if (hasLoaded.value) {
          stats.resolution.width = video_.videoWidth
          stats.resolution.height = video_.videoHeight
        } else {
          video_.addEventListener('loadeddata', () => {
            stats.resolution.width = video_.videoWidth
            stats.resolution.height = video_.videoHeight
          }, {
            once: true
          })
        }
      } else {
        stats.resolution.width = width
        stats.resolution.height = height
      }
    }

    function updateStats() {
      const playerDimensions = video.value.getBoundingClientRect()
      stats.playerDimensions = {
        width: Math.floor(playerDimensions.width),
        height: Math.floor(playerDimensions.height)
      }

      const playerStats = player.getStats()

      if (props.format !== 'audio') {
        stats.frames = {
          droppedFrames: playerStats.droppedFrames,
          totalFrames: playerStats.decodedFrames
        }
      }

      if (props.format !== 'legacy') {
        // estimated bandwidth is NaN for legacy, as none of the requests go through shaka,
        // so it has no way to estimate the bandwidth
        stats.bandwidth = (playerStats.estimatedBandwidth / 1000).toFixed(2)
      }

      let bufferedSeconds = 0

      const buffered = player.getBufferedInfo().total

      for (const { start, end } of buffered) {
        bufferedSeconds += end - start
      }

      const seekRange = player.seekRange()
      const duration = seekRange.end - seekRange.start

      stats.buffered = ((bufferedSeconds / duration) * 100).toFixed(2)
    }

    watch(showStats, (newValue) => {
      if (newValue) {
        // for abr changes/auto quality
        player.addEventListener('adaptation', updateQualityStats)

        // for manual changes e.g. in quality selector
        player.addEventListener('variantchanged', updateQualityStats)
      } else {
        // for abr changes/auto quality
        player.removeEventListener('adaptation', updateQualityStats)

        // for manual changes e.g. in quality selector
        player.removeEventListener('variantchanged', updateQualityStats)
      }
    })

    watch(activeLegacyFormat, updateLegacyQualityStats)

    // #endregion stats

    // #region screenshots

    async function takeScreenshot() {
      // TODO: needs to be refactored to be less reliant on node stuff, so that it can be used in the web (and android) builds

      const video_ = video.value

      const width = video_.videoWidth
      const height = video_.videoHeight

      if (width <= 0) {
        return
      }

      // Need to set crossorigin="anonymous" for LegacyFormat on Invidious
      // https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(video_, 0, 0)

      const format = screenshotFormat.value
      const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`
      const imageQuality = format === 'jpg' ? screenshotQuality.value / 100 : 1

      let filename
      try {
        filename = await store.dispatch('parseScreenshotCustomFileName', {
          date: new Date(Date.now()),
          playerTime: video_.currentTime,
          videoId: props.videoId
        })
      } catch (err) {
        console.error(`Parse failed: ${err.message}`)
        showToast(i18n.t('Screenshot Error', { error: err.message }))
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
      if (screenshotAskPath.value) {
        const wasPlaying = !video_.paused
        if (wasPlaying) {
          video_.pause()
        }

        if (screenshotFolder.value === '' || !(await pathExists(screenshotFolder.value))) {
          dirPath = await getPicturesPath()
        } else {
          dirPath = screenshotFolder.value
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
          video_.play()
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
        store.dispatch('updateScreenshotFolderPath', dirPath)
      } else {
        if (screenshotFolder.value === '') {
          dirPath = path.join(await getPicturesPath(), 'Freetube', subDir)
        } else {
          dirPath = path.join(screenshotFolder.value, subDir)
        }

        if (!(await pathExists(dirPath))) {
          try {
            await fs.mkdir(dirPath, { recursive: true })
          } catch (err) {
            console.error(err)
            showToast(i18n.t('Screenshot Error', { error: err }))
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
              showToast(i18n.t('Screenshot Success', { filePath }))
            })
            .catch((err) => {
              console.error(err)
              showToast(i18n.t('Screenshot Error', { error: err }))
            })
        })
      }, mimeType, imageQuality)
      canvas.remove()
    }

    // #endregion screenshots

    // #region custom player controls

    const { ContextMenu: shakaContextMenu, Controls: shakaControls, OverflowMenu: shakaOverflowMenu } = shaka.ui

    function registerAudioTrackSelection() {
      /** @implements {shaka.extern.IUIElement.Factory} */
      class AudioTrackSelectionFactory {
        create(rootElement, controls) {
          return new AudioTrackSelection(events, rootElement, controls)
        }
      }

      shakaControls.registerElement('ft_audio_tracks', new AudioTrackSelectionFactory())
      shakaOverflowMenu.registerElement('ft_audio_tracks', new AudioTrackSelectionFactory())
    }

    function registerTheatreModeButton() {
      events.addEventListener('toggleTheatreMode', () => {
        emit('toggle-theatre-mode')
      })

      /**
       * @implements {shaka.extern.IUIElement.Factory}
       */
      class TheatreModeButtonFactory {
        create(rootElement, controls) {
          return new TheatreModeButton(props.useTheatreMode, events, rootElement, controls)
        }
      }

      shakaControls.registerElement('ft_theatre_mode', new TheatreModeButtonFactory())
      shakaOverflowMenu.registerElement('ft_theatre_mode', new TheatreModeButtonFactory())
    }

    function registerFullWindowButton() {
      events.addEventListener('setFullWindow', (/** @type {CustomEvent} */ event) => {
        if (event.detail) {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        }

        fullWindowEnabled.value = event.detail

        if (fullWindowEnabled.value) {
          document.body.classList.add('playerFullWindow')
        } else {
          document.body.classList.remove('playerFullWindow')
        }
      })

      /**
       * @implements {shaka.extern.IUIElement.Factory}
       */
      class FullWindowButtonFactory {
        create(rootElement, controls) {
          return new FullWindowButton(fullWindowEnabled.value, events, rootElement, controls)
        }
      }

      shakaControls.registerElement('ft_full_window', new FullWindowButtonFactory())
      shakaOverflowMenu.registerElement('ft_full_window', new FullWindowButtonFactory())
    }

    function registerLegacyQualitySelection() {
      events.addEventListener('setLegacyFormat', async (/** @type {CustomEvent} */ event) => {
        const { format, playbackPosition, restoreCaptionIndex: restoreCaptionIndex_ = null } = event.detail

        if (restoreCaptionIndex_ !== null) {
          restoreCaptionIndex = restoreCaptionIndex_
        }

        activeLegacyFormat.value = event.detail.format
        try {
          await player.load(format.url, playbackPosition, format.mimeType)
        } catch (error) {
          handleError(error, 'setLegacyFormat', event.detail)
        }
      })

      /**
       * @implements {shaka.extern.IUIElement.Factory}
       */
      class LegacyQualitySelectionFactory {
        create(rootElement, controls) {
          return new LegacyQualitySelection(
            activeLegacyFormat.value,
            props.legacyFormats,
            events,
            rootElement,
            controls
          )
        }
      }

      shakaControls.registerElement('ft_legacy_quality', new LegacyQualitySelectionFactory())
      shakaOverflowMenu.registerElement('ft_legacy_quality', new LegacyQualitySelectionFactory())
    }

    function registerStatsButton() {
      events.addEventListener('setStatsVisibility', (/** @type {CustomEvent} */ event) => {
        showStats.value = event.detail

        if (showStats.value) {
          gatherInitialStatsValues()
        }
      })

      /**
       * @implements {shaka.extern.IUIElement.Factory}
       */
      class StatsButtonFactory {
        create(rootElement, controls) {
          return new StatsButton(showStats.value, events, rootElement, controls)
        }
      }

      shakaContextMenu.registerElement('ft_stats', new StatsButtonFactory())
    }

    function registerScreenshotButton() {
      events.addEventListener('takeScreenshot', () => {
        takeScreenshot()
      })

      /**
       * @implements {shaka.extern.IUIElement.Factory}
       */
      class ScreenshotButtonFactory {
        create(rootElement, controls) {
          return new ScreenshotButton(events, rootElement, controls)
        }
      }

      shakaControls.registerElement('ft_screenshot', new ScreenshotButtonFactory())
      shakaOverflowMenu.registerElement('ft_screenshot', new ScreenshotButtonFactory())
    }

    /**
     * As shaka-player doesn't let you unregister custom control factories,
     * overwrite them with `null` instead so the referenced objects
     * (e.g. {@linkcode events}, {@linkcode fullWindowEnabled}) can get gargabe collected
     */
    function cleanUpCustomPlayerControls() {
      shakaControls.registerElement('ft_audio_tracks', null)
      shakaOverflowMenu.registerElement('ft_audio_tracks', null)

      shakaControls.registerElement('ft_theatre_mode', null)
      shakaOverflowMenu.registerElement('ft_theatre_mode', null)

      shakaControls.registerElement('ft_full_window', null)
      shakaOverflowMenu.registerElement('ft_full_window', null)

      shakaControls.registerElement('ft_legacy_quality', null)
      shakaOverflowMenu.registerElement('ft_legacy_quality', null)

      shakaContextMenu.registerElement('ft_stats', null)

      if (process.env.IS_ELECTRON) {
        shakaControls.registerElement('ft_screenshot', null)
        shakaOverflowMenu.registerElement('ft_screenshot', null)
      }
    }

    // #endregion custom player controls

    // #region mouse and keyboard helpers

    /**
     * @param {number} step
     */
    function changeVolume(step) {
      const volumeBar = container.value.querySelector('.shaka-volume-bar')

      const newValue = parseFloat(volumeBar.value) + (step * 100)

      if (newValue < 0) {
        volumeBar.value = 0
      } else if (newValue > 100) {
        volumeBar.value = 100
      } else {
        volumeBar.value = newValue
      }

      volumeBar.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
    }

    /**
     * @param {number} step
     */
    function changePlayBackRate(step) {
      const video_ = video.value
      const newPlaybackRate = parseFloat((video_.playbackRate + step).toFixed(2))

      // The following error is thrown if you go below 0.07:
      // The provided playback rate (0.05) is not in the supported playback range.
      if (newPlaybackRate > 0.07 && newPlaybackRate <= maxVideoPlaybackRate.value) {
        video_.playbackRate = newPlaybackRate
        video_.defaultPlaybackRate = newPlaybackRate
      }
    }

    function canSeek() {
      if (!player || !hasLoaded.value) {
        return false
      }

      const seekRange = player.seekRange()

      // Seeking not possible e.g. with HLS
      if (seekRange.start === seekRange.end) {
        return false
      }

      return true
    }

    /**
     * @param {number} seconds The number of seconds to seek by, positive values seek forwards, negative ones seek backwards
     * @param {boolean} canSeekResult Allow functions that have already checked whether seeking is possible, to skip the extra check (e.g. frameByFrame)
     */
    function seekBySeconds(seconds, canSeekResult = false) {
      if (!(canSeekResult || canSeek())) {
        return
      }

      const seekRange = player.seekRange()

      const video_ = video.value

      const currentTime = video_.currentTime
      const newTime = currentTime + seconds

      if (newTime < seekRange.start) {
        video_.currentTime = seekRange.start
      } else if (newTime > seekRange.end) {
        if (isLive.value) {
          player.goToLive()
        } else {
          video_.currentTime = seekRange.end
        }
      } else {
        video_.currentTime = newTime
      }
    }

    // #endregion mouse and keyboard helpers

    // #region mouse scroll handlers

    /**
     * @param {WheelEvent} event
     */
    function mouseScrollPlaybackRate(event) {
      event.preventDefault()

      if ((event.deltaY < 0 || event.deltaX > 0)) {
        changePlayBackRate(0.05)
      } else if ((event.deltaY > 0 || event.deltaX < 0)) {
        changePlayBackRate(-0.05)
      }
    }

    /**
     * @param {WheelEvent} event
     */
    function mouseScrollSkip(event) {
      if (canSeek()) {
        event.preventDefault()

        if ((event.deltaY < 0 || event.deltaX > 0)) {
          seekBySeconds(defaultSkipInterval.value * video.value.playbackRate, true)
        } else if ((event.deltaY > 0 || event.deltaX < 0)) {
          seekBySeconds(-defaultSkipInterval.value * video.value.playbackRate, true)
        }
      }
    }

    /**
     * @param {WheelEvent} event
     * */
    function mouseScrollVolume(event) {
      if (!event.ctrlKey && !event.metaKey) {
        event.preventDefault()
        event.stopPropagation()

        const video_ = video.value

        if (video_.muted && (event.deltaY < 0 || event.deltaX > 0)) {
          video_.muted = false
          video_.volume = 0
        }

        if (!video_.muted) {
          if ((event.deltaY < 0 || event.deltaX > 0)) {
            changeVolume(0.05)
          } else if ((event.deltaY > 0 || event.deltaX < 0)) {
            changeVolume(-0.05)
          }
        }
      }
    }

    // #endregion mouse scroll handlers

    // #region keyboard shortcuts

    /**
     * determines whether the jump to the previous or next chapter
     * with the the keyboard shortcuts, should be done
     * first it checks whether there are any chapters (the array is also empty if chapters are hidden)
     * it also checks that the approprate combination was used ALT/OPTION on macOS and CTRL everywhere else
     * @param {KeyboardEvent} event the keyboard event
     * @param {string} direction the direction of the jump either previous or next
     */
    function canChapterJump(event, direction) {
      const currentChapter = props.currentChapterIndex
      return props.chapters.length > 0 &&
        (direction === 'previous' ? currentChapter > 0 : props.chapters.length - 1 !== currentChapter) &&
        ((process.platform !== 'darwin' && event.ctrlKey) ||
          (process.platform === 'darwin' && event.metaKey))
    }

    /**
     * @param {number} step
     */
    function frameByFrame(step) {
      if (props.format === 'audio' || !canSeek()) {
        return
      }

      video.value.pause()

      /** @type {number} */
      let fps
      if (props.format === 'legacy') {
        fps = activeLegacyFormat.value.fps
      } else {
        fps = player.getVariantTracks().find(track => track.active).frameRate
      }

      const frameTime = 1 / fps
      const dist = frameTime * step
      seekBySeconds(dist, true)
    }

    /**
     * @param {KeyboardEvent} event
     */
    function keyboardShortcutHandler(event) {
      if (!player || !hasLoaded.value) {
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

      const video_ = video.value

      switch (event.key) {
        case ' ':
        case 'Spacebar': // older browsers might return spacebar instead of a space character
        case 'K':
        case 'k':
          // Toggle Play/Pause
          event.preventDefault()
          video_.paused ? video_.play() : video_.pause()
          break
        case 'J':
        case 'j':
          // Rewind by 2x the time-skip interval (in seconds)
          event.preventDefault()
          seekBySeconds(-defaultSkipInterval.value * video_.playbackRate * 2)
          break
        case 'L':
        case 'l':
          // Fast-Forward by 2x the time-skip interval (in seconds)
          event.preventDefault()
          seekBySeconds(defaultSkipInterval.value * video_.playbackRate * 2)
          break
        case 'O':
        case 'o':
          // Decrease playback rate by user configured interval
          event.preventDefault()
          changePlayBackRate(-videoPlaybackRateInterval.value)
          break
        case 'P':
        case 'p':
          // Increase playback rate by user configured interval
          event.preventDefault()
          changePlayBackRate(videoPlaybackRateInterval.value)
          break
        case 'F':
        case 'f':
          // Toggle full screen
          event.preventDefault()
          ui.getControls().toggleFullScreen()
          break
        case 'M':
        case 'm':
          // Toggle mute only if metakey is not pressed
          if (!event.metaKey) {
            event.preventDefault()
            video_.muted = !video_.muted
          }
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
          changeVolume(0.05)
          break
        case 'ArrowDown':
          // Decrease Volume
          event.preventDefault()
          changeVolume(-0.05)
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (canChapterJump(event, 'previous')) {
            // Jump to the previous chapter
            video_.currentTime = props.chapters[props.currentChapterIndex - 1].startSeconds
          } else {
            // Rewind by the time-skip interval (in seconds)
            seekBySeconds(-defaultSkipInterval.value * video_.playbackRate)
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (canChapterJump(event, 'next')) {
            // Jump to the next chapter
            video_.currentTime = (props.chapters[props.currentChapterIndex + 1].startSeconds)
          } else {
            // Fast-Forward by the time-skip interval (in seconds)
            seekBySeconds(defaultSkipInterval.value * video_.playbackRate)
          }
          break
        case 'I':
        case 'i':
          // Toggle picture in picture
          if (props.format !== 'audio') {
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
          if (canSeek()) {
            event.preventDefault()

            // use seek range instead of duration so that it works for live streams too
            const seekRange = player.seekRange()

            const length = seekRange.end - seekRange.start
            const percentage = parseInt(event.key) / 10

            video_.currentTime = seekRange.start + (length * percentage)
          }
          break
        }
        case ',':
          event.preventDefault()
          // Return to previous frame
          frameByFrame(-1)
          break
        case '.':
          event.preventDefault()
          // Advance to next frame
          frameByFrame(1)
          break
        case 'D':
        case 'd':
          // Toggle stats display
          event.preventDefault()

          events.dispatchEvent(new CustomEvent('setStatsVisibility', {
            detail: !showStats.value
          }))
          break
        case 'Escape':
          // Exit full window
          if (fullWindowEnabled.value) {
            event.preventDefault()

            events.dispatchEvent(new CustomEvent('setFullWindow', {
              detail: false
            }))
          }
          break
        case 'S':
        case 's':
          // Toggle full window mode
          event.preventDefault()
          events.dispatchEvent(new CustomEvent('setFullWindow', {
            detail: !fullWindowEnabled.value
          }))
          break
        case 'T':
        case 't':
          // Toggle theatre mode
          if (props.theatrePossible) {
            event.preventDefault()

            events.dispatchEvent(new CustomEvent('toggleTheatreMode', {
              detail: !props.useTheatreMode
            }))
          }
          break
        case 'U':
        case 'u':
          if (process.env.IS_ELECTRON && enableScreenshot.value && props.format !== 'audio') {
            event.preventDefault()
            // Take screenshot
            takeScreenshot()
          }
          break
      }
    }

    // #endregion keyboard shortcuts

    /**
     * @param {shaka.util.Error} error
     * @param {string} context
     * @param {object=} details
     */
    function handleError(error, context, details) {
      logShakaError(error, context, props.videoId, details)

      // text related errors aren't serious (captions and seek bar thumbnails), so we should just log them
      // TODO: consider only emitting when the severity is crititcal?
      if (error.category !== shaka.util.Error.Category.TEXT) {
        emit('error', error)

        stopPowerSaveBlocker()

        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'none'
        }
      }
    }

    // #region seek bar markers

    /**
     * @param {number} duration As the sponsorblock segments can sometimes load before the video does, we need to pass in the duration here
     */
    function createSponsorBlockMarkers(duration) {
      addMarkers(
        sponsorBlockSegments.map(segment => {
          const markerDiv = document.createElement('div')

          markerDiv.title = translateSponsorBlockCategory(segment.category)
          markerDiv.className = `sponsorBlockMarker main${sponsorSkips.value.categoryData[segment.category].color}`
          markerDiv.style.width = `${((segment.endTime - segment.startTime) / duration) * 100}%`
          markerDiv.style.left = `${(segment.startTime / duration) * 100}%`

          return markerDiv
        })
      )
    }

    function createChapterMarkers() {
      const { start, end } = player.seekRange()
      const duration = end - start

      /**
       * @type {{
       *   title: string,
       *   timestamp: string,
       *   startSeconds: number,
       *   endSeconds: number,
       *   thumbnail?: string
       * }[]}
       */
      const chapters = props.chapters

      addMarkers(
        chapters.map(chapter => {
          const markerDiv = document.createElement('div')

          markerDiv.title = chapter.title
          markerDiv.className = 'chapterMarker'
          markerDiv.style.left = `calc(${(chapter.startSeconds / duration) * 100}% - 1px)`

          return markerDiv
        })
      )
    }

    /**
     * @param {HTMLDivElement[]} markers
     */
    function addMarkers(markers) {
      const seekBarContainer = container.value.querySelector('.shaka-seek-bar-container')

      if (seekBarContainer.firstElementChild?.classList.contains('markerContainer')) {
        /** @type {HTMLDivElement} */
        const markerBar = seekBarContainer.firstElementChild

        markers.forEach(marker => markerBar.appendChild(marker))
      } else {
        const markerBar = document.createElement('div')
        markerBar.className = 'markerContainer'

        markers.forEach(marker => markerBar.appendChild(marker))

        seekBarContainer.insertBefore(markerBar, seekBarContainer.firstElementChild)
      }
    }

    // #endregion seek bar markers

    // #region offline message

    const isOffline = ref(!navigator.onLine)
    const isBuffering = ref(false)

    function onlineHandler() {
      isOffline.value = false
    }

    function offlineHandler() {
      isOffline.value = true
    }

    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)

    // Only display the offline message while buffering/the loading symbol is visible.
    // If we briefly lose the connection but it comes back before the buffer is empty,
    // the user won't notice anything so we don't need to display the message.
    const showOfflineMessage = computed(() => {
      return isOffline.value && isBuffering.value
    })

    // #endregion offline message

    // #region setup

    onMounted(async () => {
      const videoElement = video.value

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

      videoElement.playbackRate = defaultPlayback.value
      videoElement.defaultPlaybackRate = defaultPlayback.value

      const localPlayer = new shaka.Player()

      ui = new shaka.ui.Overlay(
        localPlayer,
        container.value,
        videoElement,
        vrCanvas.value
      )

      // This has to be called after creating the UI, so that the player uses the UI's UITextDisplayer
      // otherwise it uses the browsers native captions which get displayed underneath the UI controls
      await localPlayer.attach(videoElement)

      // check if the component is already getting destroyed
      // which is possible because this function runs asynchronously
      if (!ui) {
        return
      }

      const controls = ui.getControls()
      player = controls.getPlayer()

      player.addEventListener('buffering', event => {
        isBuffering.value = event.buffering
      })

      player.addEventListener('error', event => handleError(event.detail, 'shaka error handler'))

      player.configure(getPlayerConfig(props.format, defaultQuality.value === 'auto'))

      if (process.env.SUPPORTS_LOCAL_API) {
        player.getNetworkingEngine().registerRequestFilter(requestFilter)
        player.getNetworkingEngine().registerResponseFilter(responseFilter)
      }

      await setLocale(i18n.locale)

      // check if the component is already getting destroyed
      // which is possible because this function runs asynchronously
      if (!ui || !player) {
        return
      }

      if (process.env.IS_ELECTRON) {
        registerScreenshotButton()
      }
      registerAudioTrackSelection()
      registerTheatreModeButton()
      registerFullWindowButton()
      registerLegacyQualitySelection()
      registerStatsButton()

      if (ui.isMobile()) {
        useOverFlowMenu.value = true
      } else {
        useOverFlowMenu.value = container.value.getBoundingClientRect().width <= USE_OVERFLOW_MENU_WIDTH_THRESHOLD

        resizeObserver = new ResizeObserver(resized)
        resizeObserver.observe(container.value)
      }

      controls.addEventListener('uiupdated', addUICustomizations)
      configureUI(true)

      document.removeEventListener('keydown', keyboardShortcutHandler)
      document.addEventListener('keydown', keyboardShortcutHandler)

      player.addEventListener('loading', () => {
        hasLoaded.value = false
      })

      player.addEventListener('loaded', handleLoaded)

      if (props.format !== 'legacy') {
        player.addEventListener('streaming', () => {
          hasMultipleAudioTracks.value = player.getAudioLanguagesAndRoles().length > 1

          if (props.format === 'dash') {
            const firstVariant = player.getVariantTracks()[0]

            // force the player aspect ratio to 16:9 to avoid overflowing the layout
            forceAspectRatio.value = firstVariant.width / firstVariant.height < 1.5
          }
        })
      } else {
        // force the player aspect ratio to 16:9 to avoid overflowing the layout, when the video is too tall

        // Invidious doesn't provide any height or width information for their legacy formats, so lets read it from the video instead
        // they have a size property but it's hard-coded, so it reports false information for shorts for example

        const firstFormat = props.legacyFormats[0]
        if (typeof firstFormat.width === 'undefined' || typeof firstFormat.height === 'undefined') {
          videoElement.addEventListener('loadeddata', () => {
            forceAspectRatio.value = videoElement.videoWidth / videoElement.videoHeight < 1.5
          }, {
            once: true
          })
        } else {
          forceAspectRatio.value = firstFormat.width / firstFormat.height < 1.5
        }
      }

      if (useSponsorBlock.value && sponsorSkips.value.seekBar.length > 0) {
        setupSponsorBlock()
      }

      window.addEventListener('beforeunload', stopPowerSaveBlocker)

      await performFirstLoad()
    })

    async function performFirstLoad() {
      if (props.format === 'dash' || props.format === 'audio') {
        try {
          await player.load(props.manifestSrc, props.startTime, props.manifestMimeType)

          if (defaultQuality.value !== 'auto') {
            if (props.format === 'dash') {
              setDashQuality(defaultQuality.value)
            } else {
              let variants = player.getVariantTracks()

              if (hasMultipleAudioTracks.value) {
                // default audio track
                variants = variants.filter(variant => variant.audioRoles.includes('main'))
              }

              const highestBandwidth = Math.max(...variants.map(variant => variant.audioBandwidth))
              variants = variants.filter(variant => variant.audioBandwidth === highestBandwidth)

              player.selectVariantTrack(variants[0])
            }
          }
        } catch (error) {
          handleError(error, 'loading dash/audio manifest and setting default quality in mounted')
        }
      } else {
        await setLegacyQuality(null, props.startTime)
      }
    }

    /**
     * Adds the captions and thumbnail tracks, also restores the previously selected captions track,
     * if this was triggered by a format change and the user had the captions enabled.
     */
    async function handleLoaded() {
      hasLoaded.value = true
      emit('loaded')

      // ideally we would set this in the `streaming` event handler, but for HLS this is only set to true after the loaded event fires.
      isLive.value = player.isLive()

      const promises = []

      for (const caption of sortedCaptions) {
        if (props.format === 'legacy') {
          const url = new URL(caption.url)

          if (url.hostname.endsWith('.youtube.com') && url.pathname === '/api/timedtext' &&
            url.searchParams.get('caps') === 'asr' && url.searchParams.get('kind') === 'asr' && url.searchParams.get('fmt') === 'vtt') {
            promises.push((async () => {
              try {
                const response = await fetch(caption.url)
                let text = await response.text()

                text = text.replaceAll(/ align:start position:0%$/gm, '')

                const url = `data:${caption.mimeType};charset=utf-8,${encodeURIComponent(text)}`

                await player.addTextTrackAsync(
                  url,
                  caption.language,
                  'captions',
                  caption.mimeType,
                  undefined, // codec, only needed if the captions are inside a container (e.g. mp4)
                  caption.label
                )
              } catch (error) {
                if (error instanceof shaka.util.Error) {
                  handleError(error, 'addTextTrackAsync', caption)
                } else {
                  console.error(error)
                }
              }
            })())
          } else {
            promises.push(
              player.addTextTrackAsync(
                caption.url,
                caption.language,
                'captions',
                caption.mimeType,
                undefined, // codec, only needed if the captions are inside a container (e.g. mp4)
                caption.label
              )
                .catch(error => handleError(error, 'addTextTrackAsync', caption))
            )
          }
        } else {
          promises.push(
            player.addTextTrackAsync(
              caption.url,
              caption.language,
              'captions',
              caption.mimeType,
              undefined, // codec, only needed if the captions are inside a container (e.g. mp4)
              caption.label
            )
              .catch(error => handleError(error, 'addTextTrackAsync', caption))
          )
        }
      }

      if (!isLive.value && props.storyboardSrc) {
        promises.push(
          // Only log the error, as the thumbnails are a nice to have
          // If an error occurs with them, it's not critical
          player.addThumbnailsTrack(props.storyboardSrc, 'text/vtt')
            .catch(error => logShakaError(error, 'addThumbnailsTrack', props.videoId, props.storyboardSrc))
        )
      }

      await Promise.all(promises)

      if (restoreCaptionIndex !== null) {
        const index = restoreCaptionIndex
        restoreCaptionIndex = null

        const textTrack = player.getTextTracks()[index]

        if (textTrack) {
          player.selectTextTrack(textTrack)

          await player.setTextTrackVisibility(true)
        }
      }

      if (props.chapters.length > 0) {
        createChapterMarkers()
      }
    }

    watch(
      () => props.format,
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
      async (newFormat, oldFormat) => {
        // format switch happened before the player loaded, probably because of an error
        // as there are no previous player settings to restore, we should treat it like this was the original format
        if (!hasLoaded.value) {
          player.configure(getPlayerConfig(newFormat, defaultQuality.value === 'auto'))

          await performFirstLoad()
          return
        }

        const video_ = video.value

        const wasPaused = video_.paused

        let useAutoQuality = oldFormat === 'legacy' ? defaultQuality.value === 'auto' : player.getConfiguration().abr.enabled

        if (!wasPaused) {
          video_.pause()
        }

        const playbackPosition = video_.currentTime

        const activeCaptionIndex = player.getTextTracks().findIndex(caption => caption.active)

        if (activeCaptionIndex >= 0 && player.isTextTrackVisible()) {
          restoreCaptionIndex = activeCaptionIndex

          // hide captions before switching as shaka/the browser doesn't clean up the displayed captions
          // when switching away from the legacy formats
          await player.setTextTrackVisibility(false)
        } else {
          restoreCaptionIndex = null
        }

        if (newFormat === 'audio' || newFormat === 'dash') {
          let label
          let audioBandwidth
          let dimension

          if (oldFormat === 'legacy' && newFormat === 'dash') {
            const legacyFormat = activeLegacyFormat.value

            if (!useAutoQuality) {
              dimension = qualityLabelToDimension(legacyFormat.qualityLabel)
            }
          } else if (oldFormat !== 'legacy') {
            const track = player.getVariantTracks().find(track => track.active)

            if (typeof track.audioBandwidth === 'number') {
              audioBandwidth = track.audioBandwidth
            }

            if (track.label) {
              label = track.label
            }
          }

          if (oldFormat === 'audio' && newFormat === 'dash' && !useAutoQuality) {
            if (defaultQuality.value !== 'auto') {
              dimension = defaultQuality.value
            } else {
              // Use auto as we don't know what resolution to pick
              useAutoQuality = true
            }
          }

          player.configure(getPlayerConfig(newFormat, useAutoQuality))

          try {
            await player.load(props.manifestSrc, playbackPosition, props.manifestMimeType)

            if (useAutoQuality) {
              if (label) {
                player.selectVariantsByLabel(label)
              }
            } else {
              if (dimension) {
                setDashQuality(dimension, audioBandwidth, label)
              } else {
                let variants = player.getVariantTracks()

                if (label) {
                  variants = variants.filter(variant => variant.label === label)
                }

                let chosenVariant

                if (typeof audioBandwidth === 'number') {
                  chosenVariant = findMostSimilarAudioBandwidth(variants, audioBandwidth)
                } else {
                  chosenVariant = variants.reduce((previous, current) => {
                    return previous === null || current.bandwidth > previous.bandwidth ? current : previous
                  }, null)
                }

                player.selectVariantTrack(chosenVariant)
              }
            }
          } catch (error) {
            handleError(error, 'loading dash/audio manifest for format switch', `${oldFormat} -> ${newFormat}`)
          }
          activeLegacyFormat.value = null
        } else {
          await setLegacyQuality(oldFormat, playbackPosition)
        }

        if (wasPaused) {
          video_.pause()
        }
      }
    )

    // #endregion setup

    // #region tear down

    onBeforeUnmount(() => {
      hasLoaded.value = false
      document.body.classList.remove('playerFullWindow')

      document.removeEventListener('keydown', keyboardShortcutHandler)

      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }

      cleanUpCustomPlayerControls()

      stopPowerSaveBlocker()
      window.removeEventListener('beforeunload', stopPowerSaveBlocker)

      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none'
      }

      skippedSponsorBlockSegments.value.forEach(segment => clearTimeout(segment.timeoutId))

      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)
    })

    // #endregion tear down

    // #region functions used by the watch page

    function isPaused() {
      return video.value.paused
    }

    function pause() {
      video.value.pause()
    }

    function getCurrentTime() {
      return video.value.currentTime
    }

    /**
     * @param {number} time
     */
    function setCurrentTime(time) {
      video.value.currentTime = time
    }

    /**
     * Vue's lifecycle hooks are synchonous, so if we destroy the player in {@linkcode onBeforeUnmount},
     * it won't be finished in time, as the player destruction is asynchronous.
     * To workaround that we destroy the player first and wait for it to finish before we unmount this component.
     */
    async function destroyPlayer() {
      if (ui) {
        // destroying the ui also destroys the player
        await ui.destroy()
        ui = null
        player = null
      } else if (player) {
        await player.destroy()
        player = null
      }

      // shaka-player doesn't clear these itself, which prevents shaka.ui.Overlay from being garbage collected
      // Should really be fixed in shaka-player but it's easier just to do it ourselves
      if (container.value) {
        container.value.ui = null
      }

      if (video.value) {
        video.value.ui = null
      }
    }

    expose({
      hasLoaded,

      isPaused,
      pause,
      getCurrentTime,
      setCurrentTime,
      destroyPlayer
    })

    // #endregion functions used by the watch page

    return {
      container,
      video,
      vrCanvas,

      fullWindowEnabled,
      forceAspectRatio,

      showStats,
      stats,

      autoplayVideos,
      sponsorBlockShowSkippedToast,

      skippedSponsorBlockSegments,

      showOfflineMessage,

      handlePlay,
      handlePause,
      handleEnded,
      updateVolume,
      handleTimeupdate,
    }
  }
})
