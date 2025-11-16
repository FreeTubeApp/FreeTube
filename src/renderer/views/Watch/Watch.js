import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import shaka from 'shaka-player'
import { Utils, YTNodes } from 'youtubei.js'
import FtLoader from '../../components/FtLoader/FtLoader.vue'
import FtShakaVideoPlayer from '../../components/ft-shaka-video-player/ft-shaka-video-player.vue'
import WatchVideoInfo from '../../components/WatchVideoInfo/WatchVideoInfo.vue'
import WatchVideoChapters from '../../components/WatchVideoChapters/WatchVideoChapters.vue'
import WatchVideoDescription from '../../components/WatchVideoDescription/WatchVideoDescription.vue'
import CommentSection from '../../components/CommentSection/CommentSection.vue'
import WatchVideoLiveChat from '../../components/WatchVideoLiveChat/WatchVideoLiveChat.vue'
import WatchVideoPlaylist from '../../components/watch-video-playlist/watch-video-playlist.vue'
import WatchVideoRecommendations from '../../components/WatchVideoRecommendations/WatchVideoRecommendations.vue'
import FtAgeRestricted from '../../components/FtAgeRestricted/FtAgeRestricted.vue'
import packageDetails from '../../../../package.json'
import {
  buildVTTFileLocally,
  copyToClipboard,
  extractNumberFromString,
  formatDurationAsTimestamp,
  formatNumber,
  showToast
} from '../../helpers/utils'
import {
  getLocalVideoInfo,
  mapLocalLegacyFormat,
  parseLocalSubscriberCount,
  parseLocalTextRuns,
  parseLocalWatchNextVideo
} from '../../helpers/api/local'
import {
  convertInvidiousToLocalFormat,
  generateInvidiousDashManifestLocally,
  getProxyUrl,
  invidiousGetVideoInformation,
  mapInvidiousLegacyFormat,
  youtubeImageUrlToInvidious
} from '../../helpers/api/invidious'

const MANIFEST_TYPE_DASH = 'application/dash+xml'
const MANIFEST_TYPE_HLS = 'application/x-mpegurl'

export default defineComponent({
  name: 'Watch',
  components: {
    'ft-loader': FtLoader,
    'ft-shaka-video-player': FtShakaVideoPlayer,
    'watch-video-info': WatchVideoInfo,
    'watch-video-chapters': WatchVideoChapters,
    'watch-video-description': WatchVideoDescription,
    CommentSection,
    'watch-video-live-chat': WatchVideoLiveChat,
    'watch-video-playlist': WatchVideoPlaylist,
    'watch-video-recommendations': WatchVideoRecommendations,
    'ft-age-restricted': FtAgeRestricted
  },
  beforeRouteLeave: async function (to, from, next) {
    this.handleRouteChange()
    window.removeEventListener('beforeunload', this.handleWatchProgressAutoSave)
    document.removeEventListener('keydown', this.resetAutoplayInterruptionTimeout)
    document.removeEventListener('click', this.resetAutoplayInterruptionTimeout)

    if (this.$refs.player) {
      await this.destroyPlayer()
    }

    next()
  },
  data: function () {
    return {
      startNextVideoInFullscreen: false,
      startNextVideoInFullwindow: false,
      startNextVideoInPip: false,
      isLoading: true,
      firstLoad: true,
      useTheatreMode: false,
      videoPlayerLoaded: false,
      isFamilyFriendly: false,
      isLive: false,
      liveChat: null,
      isLiveContent: false,
      isUpcoming: false,
      isPostLiveDvr: false,
      isUnlisted: false,
      upcomingTimestamp: null,
      upcomingTimeLeft: null,
      /** @type {'dash' | 'audio' | 'legacy'} */
      activeFormat: 'legacy',
      thumbnail: '',
      videoId: '',
      videoTitle: '',
      videoDescription: '',
      videoDescriptionHtml: '',
      license: '',
      videoViewCount: 0,
      videoLikeCount: 0,
      videoDislikeCount: 0,
      videoLengthSeconds: 0,
      videoChapters: [],
      videoCurrentChapterIndex: 0,
      /** @type {'chapters' | 'keyMoments'} */
      videoChaptersKind: 'chapters',
      channelName: '',
      channelThumbnail: '',
      channelId: '',
      channelSubscriptionCountText: '',
      videoPublished: 0,
      premiereDate: undefined,
      videoStoryboardSrc: '',
      /** @type {string|null} */
      manifestSrc: null,
      /** @type {(MANIFEST_TYPE_DASH|MANIFEST_TYPE_HLS)} */
      manifestMimeType: MANIFEST_TYPE_DASH,
      legacyFormats: [],
      captions: [],
      /** @type {'EQUIRECTANGULAR' | 'EQUIRECTANGULAR_THREED_TOP_BOTTOM' | 'MESH'| null} */
      vrProjection: null,
      autoplayNextRecommendedVideo: false,
      autoplayNextPlaylistVideo: false,
      recommendedVideos: [],
      downloadLinks: [],
      watchingPlaylist: false,
      playlistId: '',
      playlistType: '',
      playlistItemId: null,
      /** @type {number|null} */
      timestamp: null,
      playNextTimeout: null,
      playNextCountDownIntervalId: null,
      infoAreaSticky: true,
      blockVideoAutoplay: false,
      autoplayInterruptionTimeout: null,
      playabilityStatus: '',

      onMountedRun: false,

      // error handling/messages
      /** @type {string|null} */
      errorMessage: null,
      /** @type {string[]|null} */
      customErrorIcon: null,
      videoGenreIsMusic: false,
      /** @type {Date|null} */
      streamingDataExpiryDate: null,
      currentPlaybackRate: null,
    }
  },
  computed: {
    historyEntry: function () {
      return this.$store.getters.getHistoryCacheById[this.videoId]
    },
    historyEntryExists: function () {
      return typeof this.historyEntry !== 'undefined'
    },
    rememberHistory: function () {
      return this.$store.getters.getRememberHistory
    },
    watchedProgressSavingEnabled: function () {
      return this.$store.getters.getWatchedProgressSavingMode !== 'never'
    },
    autosaveWatchedProgress: function () {
      return this.$store.getters.getWatchedProgressSavingMode === 'auto'
    },
    saveVideoHistoryWithLastViewedPlaylist: function () {
      return this.$store.getters.getSaveVideoHistoryWithLastViewedPlaylist
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
    },
    proxyVideos: function () {
      return this.$store.getters.getProxyVideos
    },
    defaultAutoplayInterruptionIntervalHours: function () {
      return this.$store.getters.getDefaultAutoplayInterruptionIntervalHours
    },
    defaultInterval: function () {
      return this.$store.getters.getDefaultInterval
    },
    defaultViewingMode: function () {
      return this.$store.getters.getDefaultViewingMode
    },
    defaultVideoFormat: function () {
      return this.$store.getters.getDefaultVideoFormat
    },
    autoplayEnabled: function () {
      return this.watchingPlaylist ? this.autoplayNextPlaylistVideo : this.autoplayNextRecommendedVideo
    },
    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },
    autoplayNextRecommendedVideoByDefault: function () {
      return this.$store.getters.getPlayNextVideo
    },
    autoplayNextPlaylistVideoByDefault: function () {
      return this.$store.getters.getAutoplayPlaylists
    },
    hideRecommendedVideos: function () {
      return this.$store.getters.getHideRecommendedVideos
    },
    hideLiveChat: function () {
      return this.$store.getters.getHideLiveChat
    },
    hideComments: function () {
      return this.$store.getters.getHideComments
    },
    hideVideoDescription: function () {
      return this.$store.getters.getHideVideoDescription
    },
    showFamilyFriendlyOnly: function () {
      return this.$store.getters.getShowFamilyFriendlyOnly
    },
    hideChannelSubscriptions: function () {
      return this.$store.getters.getHideChannelSubscriptions
    },
    hideVideoLikesAndDislikes: function () {
      return this.$store.getters.getHideVideoLikesAndDislikes
    },
    theatrePossible: function () {
      return !this.hideRecommendedVideos || (!this.hideLiveChat && this.isLive) || this.watchingPlaylist
    },
    autoplayPossible: function () {
      return (!this.watchingPlaylist && !this.hideRecommendedVideos && !!this.nextRecommendedVideo) ||
      (this.watchingPlaylist && !this.$refs.watchVideoPlaylist?.shouldStopDueToPlaylistEnd)
    },
    currentLocale: function () {
      return this.$i18n.locale
    },
    hideChapters: function () {
      return this.$store.getters.getHideChapters
    },
    channelsHidden() {
      return JSON.parse(this.$store.getters.getChannelsHidden).map((ch) => {
        // Legacy support
        if (typeof ch === 'string') {
          return { name: ch, preferredName: '', icon: '' }
        }
        return ch
      })
    },
    forbiddenTitles() {
      return JSON.parse(this.$store.getters.getForbiddenTitles.toLowerCase())
    },
    isUserPlaylistRequested: function () {
      return this.$route.query.playlistType === 'user'
    },
    userPlaylistsReady: function () {
      return this.$store.getters.getPlaylistsReady
    },
    selectedUserPlaylist: function () {
      if (this.playlistId == null || this.playlistId === '') { return null }
      if (!this.isUserPlaylistRequested) { return null }

      return this.$store.getters.getPlaylist(this.playlistId)
    },
    nextRecommendedVideo: function () {
      return this.recommendedVideos.find((video) =>
        !this.isHiddenVideo(this.forbiddenTitles, this.channelsHidden, video)
      )
    },
    startTimeSeconds: function () {
      if (this.isLoading || this.isLive) {
        return null
      }

      if (this.timestamp !== null && this.timestamp < this.videoLengthSeconds) {
        return this.timestamp
      } else if (this.watchedProgressSavingEnabled && this.historyEntryExists) {
        // For UX consistency, no progress reading if writing disabled

        /** @type {number} */
        const watchProgress = this.historyEntry.watchProgress

        if (watchProgress > 0 && watchProgress < this.videoLengthSeconds - 2) {
          return watchProgress
        }
      }

      return null
    },

    canSaveWatchProgress() {
      if (this.isUpcoming || this.isLive) { return false }

      // `this.$refs.player?.hasLoaded` cannot be used in computed property
      return !this.isLoading
    },
  },
  watch: {
    async $route() {
      this.handleRouteChange()

      if (this.$refs.player) {
        await this.destroyPlayer()
      }

      // react to route changes...
      this.videoId = this.$route.params.id

      this.firstLoad = true
      this.videoPlayerLoaded = false
      this.errorMessage = null
      this.customErrorIcon = null
      this.activeFormat = this.defaultVideoFormat
      this.videoStoryboardSrc = ''
      this.captions = []
      this.vrProjection = null
      this.downloadLinks = []
      this.videoCurrentChapterIndex = 0
      this.videoGenreIsMusic = false

      this.checkIfTimestamp()
      this.checkIfPlaylist()

      switch (this.backendPreference) {
        case 'local':
          this.getVideoInformationLocal(this.videoId)
          break
        case 'invidious':
          this.getVideoInformationInvidious(this.videoId)
          break
      }
    },
    userPlaylistsReady() {
      this.onMountedDependOnLocalStateLoading()
    },
  },
  created: function () {
    this.videoId = this.$route.params.id
    this.activeFormat = this.defaultVideoFormat
    // So that the value for this session remains unchanged even if setting changed
    this.autoplayNextRecommendedVideo = this.autoplayNextRecommendedVideoByDefault
    this.autoplayNextPlaylistVideo = this.autoplayNextPlaylistVideoByDefault

    this.checkIfTimestamp()
    this.currentPlaybackRate = this.$store.getters.getDefaultPlayback
  },
  mounted: function () {
    this.onMountedDependOnLocalStateLoading()
  },
  methods: {
    onMountedDependOnLocalStateLoading() {
      // Prevent running twice
      if (this.onMountedRun) { return }
      // Stuff that require user playlists to be ready
      if (this.isUserPlaylistRequested && !this.userPlaylistsReady) { return }

      this.onMountedRun = true

      this.checkIfPlaylist()

      // this has to be below checkIfPlaylist() as theatrePossible needs to know if there is a playlist or not
      this.setViewingModeOnFirstLoad()

      if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious') {
        this.getVideoInformationInvidious()
      } else {
        this.getVideoInformationLocal()
      }

      document.removeEventListener('keydown', this.resetAutoplayInterruptionTimeout)
      document.removeEventListener('click', this.resetAutoplayInterruptionTimeout)
      document.addEventListener('keydown', this.resetAutoplayInterruptionTimeout)
      document.addEventListener('click', this.resetAutoplayInterruptionTimeout)

      window.addEventListener('beforeunload', this.handleWatchProgressAutoSave)
      this.resetAutoplayInterruptionTimeout()
    },

    setViewingModeOnFirstLoad: function () {
      switch (this.defaultViewingMode) {
        case 'theatre':
          this.useTheatreMode = this.theatrePossible
          break
        case 'fullscreen':
          this.startNextVideoInFullscreen = true
          break
        case 'fullwindow':
          this.startNextVideoInFullwindow = true
          break
        case 'pip':
          this.startNextVideoInPip = true
      }
    },

    changeTimestamp: function (timestamp) {
      const player = this.$refs.player

      if (!this.isLoading && player?.hasLoaded) {
        player.setCurrentTime(timestamp)
      }
    },

    getVideoInformationLocal: async function () {
      if (this.firstLoad) {
        this.isLoading = true
      }

      try {
        const result = await getLocalVideoInfo(this.videoId)

        this.isFamilyFriendly = result.basic_info.is_family_safe

        const recommendedVideos = result.watch_next_feed
          ?.filter((item) => {
            return item.type === 'CompactVideo' || item.type === 'CompactMovie' ||
              (item.type === 'LockupView' && item.content_type === 'VIDEO')
          })
          .map(parseLocalWatchNextVideo) ?? []

        // place watched recommended videos last
        this.recommendedVideos = [
          ...recommendedVideos.filter((video) => !this.isRecommendedVideoWatched(video.videoId)),
          ...recommendedVideos.filter((video) => this.isRecommendedVideoWatched(video.videoId))
        ]

        if (this.showFamilyFriendlyOnly && !this.isFamilyFriendly) {
          this.isLoading = false
          this.handleVideoEnded()
          return
        }

        // extract localised title first and fall back to the not localised one
        this.videoTitle = result.primary_info?.title.text ?? result.basic_info.title
        this.videoViewCount = result.basic_info.view_count ?? (result.primary_info.view_count ? extractNumberFromString(result.primary_info.view_count.text) : null)
        this.license = result.secondary_info.metadata.rows.find(element => element.title?.text === 'License')?.contents[0]?.text

        this.channelId = result.basic_info.channel_id ?? result.secondary_info.owner?.author.id
        this.channelName = result.basic_info.author ?? result.secondary_info.owner?.author.name

        if (result.secondary_info.owner?.author) {
          this.channelThumbnail = result.secondary_info.owner.author.best_thumbnail?.url ?? ''
        } else {
          this.channelThumbnail = ''
        }

        this.videoGenreIsMusic = result.basic_info.category === 'Music'

        this.updateSubscriptionDetails({
          channelThumbnailUrl: this.channelThumbnail.length === 0 ? null : this.channelThumbnail,
          channelName: this.channelName,
          channelId: this.channelId
        })

        if (result.page[0].microformat?.publish_date) {
          // `result.page[0].microformat.publish_date` example value: `2023-08-12T08:59:59-07:00`
          this.videoPublished = Date.parse(result.page[0].microformat.publish_date)
        } else {
          // text date Jan 1, 2000, not as accurate but better than nothing
          this.videoPublished = Date.parse(result.primary_info.published)
        }

        if (result.secondary_info?.description.runs) {
          try {
            this.videoDescription = parseLocalTextRuns(result.secondary_info.description.runs)
          } catch (error) {
            console.error('Failed to extract the localised description, falling back to the standard one.', error, JSON.stringify(result.secondary_info.description.runs))
            this.videoDescription = result.basic_info.short_description
          }
        } else {
          this.videoDescription = result.basic_info.short_description
        }

        switch (this.thumbnailPreference) {
          case 'start':
            this.thumbnail = `https://i.ytimg.com/vi/${this.videoId}/maxres1.jpg`
            break
          case 'middle':
            this.thumbnail = `https://i.ytimg.com/vi/${this.videoId}/maxres2.jpg`
            break
          case 'end':
            this.thumbnail = `https://i.ytimg.com/vi/${this.videoId}/maxres3.jpg`
            break
          default:
            this.thumbnail = result.basic_info.thumbnail?.[0].url ?? `https://i.ytimg.com/vi/${this.videoId}/maxresdefault.jpg`
            break
        }

        if (this.hideVideoLikesAndDislikes) {
          this.videoLikeCount = null
          this.videoDislikeCount = null
        } else {
          this.videoLikeCount = isNaN(result.basic_info.like_count) ? 0 : result.basic_info.like_count

          // YouTube doesn't return dislikes anymore
          this.videoDislikeCount = 0
        }

        this.isLive = !!result.basic_info.is_live
        this.isUpcoming = !!result.basic_info.is_upcoming
        this.isLiveContent = !!result.basic_info.is_live_content
        this.isPostLiveDvr = !!result.basic_info.is_post_live_dvr
        this.isUnlisted = !!result.basic_info.is_unlisted

        const subCount = !result.secondary_info.owner.subscriber_count.isEmpty() ? parseLocalSubscriberCount(result.secondary_info.owner.subscriber_count.text) : NaN

        if (!isNaN(subCount)) {
          this.channelSubscriptionCountText = formatNumber(subCount, subCount >= 10000 ? { notation: 'compact' } : undefined)
        } else {
          this.channelSubscriptionCountText = ''
        }

        let chapters = []
        if (!this.hideChapters) {
          const rawChapters = result.player_overlays?.decorated_player_bar?.player_bar?.markers_map
            ?.find(marker => marker.marker_key === 'DESCRIPTION_CHAPTERS')?.value.chapters

          if (rawChapters) {
            for (const chapter of rawChapters) {
              const start = chapter.time_range_start_millis / 1000

              chapters.push({
                title: chapter.title.text,
                timestamp: formatDurationAsTimestamp(start),
                startSeconds: start,
                endSeconds: 0,
                thumbnail: chapter.thumbnail[0]
              })
            }
          } else {
            /** @type {import('youtubei.js').YTNodes.MacroMarkersList | null | undefined} */
            const macroMarkersList = result.page[1]?.engagement_panels
              ?.find(pannel => pannel.panel_identifier === 'engagement-panel-macro-markers-auto-chapters')?.content

            if (macroMarkersList) {
              for (const item of macroMarkersList.contents) {
                if (item instanceof YTNodes.MacroMarkersListItem) {
                  chapters.push({
                    title: item.title.text,
                    timestamp: item.time_description.text,
                    startSeconds: Utils.timeToSeconds(item.time_description.text),
                    endSeconds: 0,
                    thumbnail: item.thumbnail[0]
                  })
                }
              }
              this.videoChaptersKind = 'keyMoments'
            } else {
              chapters = this.extractChaptersFromDescription(result.basic_info.short_description ?? result.secondary_info.description.text)
            }
          }

          if (chapters.length > 0) {
            this.addChaptersEndSeconds(chapters, result.basic_info.duration)

            // prevent vue from adding reactivity which isn't needed
            // as the chapter objects are read-only after this anyway
            // the chapters are checked for every timeupdate event that the player emits
            // this should lessen the performance and memory impact of the chapters
            chapters.forEach(Object.freeze)
          }
        }

        this.videoChapters = chapters

        const playabilityStatus = result.playability_status
        this.playabilityStatus = playabilityStatus.status

        // The apostrophe is intentionally that one (char code 8217), because that is the one YouTube uses
        const BOT_MESSAGE = 'Sign in to confirm you’re not a bot'

        const isDrmProtected = result.streaming_data?.adaptive_formats.some(format => format.drm_families || format.drm_track_type)

        if (playabilityStatus.status === 'UNPLAYABLE' || playabilityStatus.status === 'LOGIN_REQUIRED' || isDrmProtected) {
          if (playabilityStatus.error_screen?.offer_id === 'sponsors_only_video') {
            // Members-only videos can only be watched while logged into a Google account that is a paid channel member
            // so there is no point trying any other backends as it will always fail
            this.errorMessage = this.$t('Video.MembersOnly')
            this.customErrorIcon = ['fas', 'money-check-dollar']
            this.isLoading = false
            this.updateTitle()
            return
          } else if (playabilityStatus.reason === 'Sign in to confirm your age' || (result.has_trailer && result.getTrailerInfo() === null)) {
            // Age-restricted videos can only be watched while logged into a Google account that is age-verified
            // so there is no point trying any other backends as it will always fail
            this.errorMessage = this.$t('Video.AgeRestricted')
            this.isLoading = false
            this.updateTitle()
            return
          } else if (isDrmProtected) {
            // DRM protected videos (e.g. movies) cannot be played in FreeTube,
            // as they require the proprietary and closed source Wideview CDM which is understandably not included in standard Electron builds
            this.errorMessage = this.$t('Video.DRMProtected')
            this.isLoading = false
            this.updateTitle()
            return
          }

          let errorText

          if (playabilityStatus.reason === BOT_MESSAGE || playabilityStatus.reason === 'Please sign in') {
            errorText = this.$t('Video.IP block')
          } else {
            errorText = `[${playabilityStatus.status}] ${playabilityStatus.reason}`

            if (playabilityStatus.error_screen?.subreason) {
              errorText += `: ${playabilityStatus.error_screen.subreason.text}`
            }
          }

          if (this.backendFallback) {
            throw new Error(errorText)
          } else {
            this.errorMessage = errorText
            this.isLoading = false
            this.updateTitle()
            return
          }
        }

        if (!this.hideLiveChat && (this.isLive || this.isUpcoming) && result.livechat) {
          this.liveChat = result.getLiveChat()
        } else {
          this.liveChat = null
        }

        if ((this.isLive || this.isPostLiveDvr) && !this.isUpcoming) {
          let useRemoteManifest = true

          if (this.isPostLiveDvr) {
            try {
              this.manifestSrc = await this.createLocalDashManifest(result, true)
              this.manifestMimeType = MANIFEST_TYPE_DASH
              useRemoteManifest = false
            } catch (error) {
              console.error(`Failed to generate DASH manifest for this Post Live DVR video ${this.videoId}, falling back to using YouTube's provided one...`, error)
            }
          }

          if (useRemoteManifest) {
            if (result.streaming_data.dash_manifest_url) {
              this.manifestSrc = result.streaming_data.dash_manifest_url
              this.manifestMimeType = MANIFEST_TYPE_DASH
            } else {
              this.manifestSrc = result.streaming_data.hls_manifest_url
              this.manifestMimeType = MANIFEST_TYPE_HLS
            }
          }

          this.streamingDataExpiryDate = result.streaming_data.expires

          if (this.activeFormat === 'legacy') {
            this.activeFormat = 'dash'
          }
        } else if (this.isUpcoming) {
          const upcomingTimestamp = result.basic_info.start_timestamp

          if (upcomingTimestamp) {
            const timestampOptions = {
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }
            const now = new Date()
            if (now.getFullYear() < upcomingTimestamp.getFullYear()) {
              Object.defineProperty(timestampOptions, 'year', {
                value: 'numeric'
              })
            }
            this.upcomingTimestamp = Intl.DateTimeFormat(this.currentLocale, timestampOptions).format(upcomingTimestamp)

            let upcomingTimeLeft = upcomingTimestamp - now

            // Convert from ms to second to minute
            upcomingTimeLeft = (upcomingTimeLeft / 1000) / 60
            let timeUnit = 'minute'

            // Youtube switches to showing time left in minutes at 120 minutes remaining
            if (upcomingTimeLeft > 120) {
              upcomingTimeLeft /= 60
              timeUnit = 'hour'
            }

            if (timeUnit === 'hour' && upcomingTimeLeft > 24) {
              upcomingTimeLeft /= 24
              timeUnit = 'day'
            }

            // Value after decimal not to be displayed
            // e.g. > 2 days = display as `2 days`
            upcomingTimeLeft = Math.floor(upcomingTimeLeft)

            // Displays when less than a minute remains
            // Looks better than `Premieres in x seconds`
            if (upcomingTimeLeft < 1) {
              this.upcomingTimeLeft = this.$t('Video.Published.In less than a minute').toLowerCase()
            } else {
              // TODO a I18n entry for time format might be needed here
              this.upcomingTimeLeft = new Intl.RelativeTimeFormat(this.currentLocale).format(upcomingTimeLeft, timeUnit)
            }

            this.premiereDate = upcomingTimestamp
          } else {
            this.upcomingTimestamp = null
            this.upcomingTimeLeft = null
            this.premiereDate = undefined
          }
        }

        if ((!this.isUpcoming && !this.isLive && !this.isPostLiveDvr) || (this.isUpcoming && this.playabilityStatus === 'OK')) {
          this.videoLengthSeconds = result.basic_info.duration
          if (result.streaming_data) {
            this.streamingDataExpiryDate = result.streaming_data.expires

            if (result.streaming_data.formats.length > 0) {
              this.legacyFormats = result.streaming_data.formats.map(mapLocalLegacyFormat)
            }

            /** @type {import('../../helpers/api/local').LocalFormat[]} */
            const formats = [...result.streaming_data.formats, ...result.streaming_data.adaptive_formats]

            const downloadLinks = []

            for (const format of formats) {
              if (format.freeTubeUrl) {
                const qualityLabel = format.quality_label ?? format.bitrate
                const fps = format.fps ? `${format.fps}fps` : 'kbps'
                const type = format.mime_type.split(';')[0]
                let label = `${qualityLabel} ${fps} - ${type}`

                if (format.has_audio !== format.has_video) {
                  if (format.has_video) {
                    label += ` ${this.$t('Video.video only')}`
                  } else {
                    label += ` ${this.$t('Video.audio only')}`
                  }
                }

                downloadLinks.push({
                  value: `${type}||${format.freeTubeUrl}`,
                  label: label
                })
              }
            }

            if (result.captions) {
              const captionTracks = result.captions?.caption_tracks?.map((caption) => {
                const url = new URL(caption.base_url)
                url.searchParams.set('fmt', 'vtt')

                return {
                  url: url.toString(),
                  label: caption.name.text,
                  language: caption.language_code,
                  mimeType: 'text/vtt'
                }
              }) ?? []

              if (captionTracks.length > 0) {
                const languagesSet = new Set([this.currentLocale, this.currentLocale.split('-')[0]])

                // special cases
                switch (this.currentLocale) {
                  case 'nn':
                  case 'nb-NO':
                    // according to https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
                    // "no" is the macro language for "nb" and "nn"
                    languagesSet.add('no')
                    break
                  case 'he':
                    // according to https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
                    // "iw" is the old/original code for Hewbrew, these days it's "he"
                    languagesSet.add('iw')
                    break
                }

                if (!captionTracks.some(captionTrack => languagesSet.has(captionTrack.language))) {
                  const translatedCaptionTrack = this.getTranslatedLocaleCaption(result.captions, languagesSet)

                  if (translatedCaptionTrack) {
                    captionTracks.push(translatedCaptionTrack)
                  }
                }
              }

              this.captions = captionTracks

              const captionLinks = captionTracks.map((caption) => {
                const label = `${caption.label} (${caption.language}) - text/vtt`

                return {
                  value: `${caption.mimeType}||${caption.url}`,
                  label: label
                }
              })

              downloadLinks.push(...captionLinks)
            }
            this.downloadLinks = downloadLinks
          } else {
            // video might be region locked or something else. This leads to no formats being available
            showToast(
              this.$t('This video is unavailable because of missing formats. This can happen due to country unavailability.'),
              7000
            )
            this.handleVideoEnded()
            return
          }

          if (result.streaming_data?.adaptive_formats.length > 0 && result.streaming_data.adaptive_formats[0].freeTubeUrl) {
            this.vrProjection = result.streaming_data.adaptive_formats
              .find(format => {
                return format.has_video &&
                  typeof format.projection_type === 'string' &&
                  format.projection_type !== 'RECTANGULAR'
              })
              ?.projection_type ?? null

            this.manifestSrc = await this.createLocalDashManifest(result)
            this.manifestMimeType = MANIFEST_TYPE_DASH
          } else {
            this.manifestSrc = null
            this.enableLegacyFormat()
          }

          if (result.storyboards?.type === 'PlayerStoryboardSpec') {
            /** @type {import('youtubei.js/dist/src/parser/classes/PlayerStoryboardSpec').StoryboardData[]} */
            let source = result.storyboards.boards
            if (window.innerWidth < 500) {
              source = source.filter((board) => board.thumbnail_height <= 90)
            }
            this.videoStoryboardSrc = this.createLocalStoryboardUrls(source.at(-1))
          }
        }

        this.isLoading = false
        this.updateTitle()
      } catch (err) {
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        console.error(err)
        if (this.backendPreference === 'local' && this.backendFallback && !err.toString().includes('private')) {
          showToast(this.$t('Falling back to Invidious API'))
          this.getVideoInformationInvidious()
        } else {
          this.isLoading = false
        }
      }
    },

    getVideoInformationInvidious: function () {
      if (this.firstLoad) {
        this.isLoading = true
      }

      invidiousGetVideoInformation(this.videoId)
        .then(async result => {
          if (result.error) {
            throw new Error(result.error)
          }

          this.videoTitle = result.title
          this.videoViewCount = result.viewCount

          const subCount = parseLocalSubscriberCount(result.subCountText)
          if (!isNaN(subCount)) {
            this.channelSubscriptionCountText = formatNumber(subCount, subCount >= 10000 ? { notation: 'compact' } : undefined)
          } else {
            this.channelSubscriptionCountText = ''
          }

          if (this.hideVideoLikesAndDislikes) {
            this.videoLikeCount = null
            this.videoDislikeCount = null
          } else {
            this.videoLikeCount = result.likeCount
            this.videoDislikeCount = result.dislikeCount
          }

          this.videoGenreIsMusic = result.genre === 'Music'

          this.channelId = result.authorId
          this.channelName = result.author
          const channelThumb = result.authorThumbnails[1]
          this.channelThumbnail = channelThumb ? youtubeImageUrlToInvidious(channelThumb.url, this.currentInvidiousInstanceUrl) : ''
          this.updateSubscriptionDetails({
            channelThumbnailUrl: channelThumb?.url,
            channelName: result.author,
            channelId: result.authorId
          })

          this.videoPublished = result.published * 1000
          this.videoDescriptionHtml = result.descriptionHtml
          const recommendedVideos = result.recommendedVideos

          // The recommended videos currently use yyyy-mm-ddThh:mm:ss for the published timestamp
          // whereas the rest of the API uses unix timestamps, correct that here
          recommendedVideos.forEach((video) => {
            if (typeof video.published === 'string') {
              video.published = Date.parse(video.published)
            }
          })

          // place watched recommended videos last
          this.recommendedVideos = [
            ...recommendedVideos.filter((video) => !this.isRecommendedVideoWatched(video.videoId)),
            ...recommendedVideos.filter((video) => this.isRecommendedVideoWatched(video.videoId))
          ]
          this.isLive = result.liveNow
          this.isFamilyFriendly = result.isFamilyFriendly
          this.isPostLiveDvr = !!result.isPostLiveDvr
          this.isUnlisted = !result.isListed

          this.captions = result.captions.map(caption => {
            return {
              url: this.currentInvidiousInstanceUrl + caption.url,
              label: caption.label,
              language: caption.language_code,
              mimeType: 'text/vtt'
            }
          })

          if (!this.isLive && !this.isPostLiveDvr) {
            this.videoStoryboardSrc = `${this.currentInvidiousInstanceUrl}/api/v1/storyboards/${this.videoId}?height=90`
          }

          switch (this.thumbnailPreference) {
            case 'start':
              this.thumbnail = `${this.currentInvidiousInstanceUrl}/vi/${this.videoId}/maxres1.jpg`
              break
            case 'middle':
              this.thumbnail = `${this.currentInvidiousInstanceUrl}/vi/${this.videoId}/maxres2.jpg`
              break
            case 'end':
              this.thumbnail = `${this.currentInvidiousInstanceUrl}/vi/${this.videoId}/maxres3.jpg`
              break
            default:
              this.thumbnail = result.videoThumbnails[0].url
              break
          }

          let chapters = []
          if (!this.hideChapters) {
            chapters = this.extractChaptersFromDescription(result.description)

            if (chapters.length > 0) {
              this.addChaptersEndSeconds(chapters, result.lengthSeconds)

              // prevent vue from adding reactivity which isn't needed
              // as the chapter objects are read-only after this anyway
              // the chapters are checked for every timeupdate event that the player emits
              // this should lessen the performance and memory impact of the chapters
              chapters.forEach(Object.freeze)
            }
          }
          this.videoChapters = chapters

          if (this.isLive || this.isPostLiveDvr) {
            // The live DASH manifest is currently unusable as it returns 403s after 1 minute of playback
            // so we have to use the HLS one for now.
            // Leaving the code here commented out in case we can use it again in the future
            // const url = `${this.currentInvidiousInstanceUrl}/api/manifest/dash/id/${this.videoId}`

            // // Proxying doesn't work for live or post live DVR DASH, so use HLS instead
            // // https://github.com/iv-org/invidious/pull/4589
            // if (this.proxyVideos) {

            this.streamingDataExpiryDate = this.extractExpiryDateFromStreamingUrl(result.adaptiveFormats[0].url)

            let hlsManifestUrl = result.hlsUrl

            if (this.proxyVideos) {
              const url = new URL(hlsManifestUrl)
              url.searchParams.set('local', 'true')
              hlsManifestUrl = url.toString()
            }

            this.manifestSrc = hlsManifestUrl
            this.manifestMimeType = MANIFEST_TYPE_HLS

            // The HLS manifests only contain combined audio+video streams, so we can't do audio only
            if (this.activeFormat === 'audio') {
              this.activeFormat = 'dash'
            }
            // } else {
            //   this.manifestSrc = url
            //   this.manifestMimeType = MANIFEST_TYPE_DASH
            // }

            this.legacyFormats = []

            if (this.activeFormat === 'legacy') {
              this.activeFormat = 'dash'
            }
          } else {
            this.videoLengthSeconds = result.lengthSeconds

            this.streamingDataExpiryDate = this.extractExpiryDateFromStreamingUrl(result.adaptiveFormats[0].url)

            this.legacyFormats = result.formatStreams.map(mapInvidiousLegacyFormat)

            if (!process.env.SUPPORTS_LOCAL_API || this.proxyVideos) {
              this.legacyFormats.forEach(format => {
                format.url = getProxyUrl(format.url)
              })
            }

            this.vrProjection = result.adaptiveFormats
              .find(stream => {
                return typeof stream.projectionType === 'string' &&
                  stream.projectionType !== 'RECTANGULAR'
              })
              ?.projectionType ?? null

            this.downloadLinks = result.adaptiveFormats.concat(result.formatStreams).map((format) => {
              const qualityLabel = format.qualityLabel || format.bitrate
              const itag = parseInt(format.itag)
              const fps = format.fps ? (format.fps + 'fps') : 'kbps'
              const type = format.type.split(';')[0]
              let label = `${qualityLabel} ${fps} - ${type}`

              if (itag !== 18 && itag !== 22) {
                if (type.includes('video')) {
                  label += ` ${this.$t('Video.video only')}`
                } else {
                  label += ` ${this.$t('Video.audio only')}`
                }
              }
              const object = {
                value: `${type}||${format.url}`,
                label: label
              }

              return object
            }).reverse().concat(result.captions.map((caption) => {
              const label = `${caption.label} (${caption.languageCode}) - text/vtt`
              const object = {
                value: `text/vtt||${caption.url}`,
                label: label
              }

              return object
            }))

            this.manifestSrc = await this.createInvidiousDashManifest(result)
            this.manifestMimeType = MANIFEST_TYPE_DASH
          }

          this.updateTitle()

          this.isLoading = false
        })
        .catch(err => {
          console.error(err)
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          showToast(`${errorMessage}: ${err}`, 10000, () => {
            copyToClipboard(err)
          })
          console.error(err)
          if (process.env.SUPPORTS_LOCAL_API && this.backendPreference === 'invidious' && this.backendFallback) {
            showToast(this.$t('Falling back to Local API'))
            this.getVideoInformationLocal()
          } else {
            this.isLoading = false
          }
        })
    },

    extractExpiryDateFromStreamingUrl: function (url) {
      const expireString = new URL(url).searchParams.get('expire')

      return new Date(parseInt(expireString) * 1000)
    },

    /**
     * @param {string?} description
     */
    extractChaptersFromDescription: function (description) {
      if (description == null) { return [] }

      /** @type {{title: string, timestamp: string, startSeconds: number, endSeconds: number}[]} */
      const chapters = []

      // HH:MM:SS Text
      // MM:SS Text
      // HH:MM:SS - Text // separator is one of '-', '–', '•', '—'
      // MM:SS - Text
      // HH:MM:SS - HH:MM:SS - Text // end timestamp is ignored, separator is one of '-', '–', '—'
      // HH:MM - HH:MM - Text // end timestamp is ignored
      const chapterMatches = description.matchAll(/^(?<timestamp>((?<hours>\d+):)?(?<minutes>\d+):(?<seconds>\d+))(\s*[–—-]\s*(?:\d+:){1,2}\d+)?\s+([–—•-]\s*)?(?<title>.+)$/gm)

      for (const { groups } of chapterMatches) {
        let start = 60 * Number(groups.minutes) + Number(groups.seconds)

        if (groups.hours) {
          start += 3600 * Number(groups.hours)
        }

        // replace previous chapter with current one if they have an identical start time
        if (chapters.length > 0 && chapters[chapters.length - 1].startSeconds === start) {
          chapters.pop()
        }

        chapters.push({
          title: groups.title.trim(),
          timestamp: groups.timestamp,
          startSeconds: start,
          endSeconds: 0
        })
      }

      return chapters
    },

    addChaptersEndSeconds: function (chapters, videoLengthSeconds) {
      for (let i = 0; i < chapters.length - 1; i++) {
        chapters[i].endSeconds = chapters[i + 1].startSeconds
      }
      chapters.at(-1).endSeconds = videoLengthSeconds
    },

    /**
     * @param {number} currentSeconds
     */
    updateCurrentChapter: function (currentSeconds) {
      const chapters = this.videoChapters

      if (this.hideChapters || chapters.length === 0) {
        return
      }

      const currentChapterStart = chapters[this.videoCurrentChapterIndex].startSeconds

      if (currentSeconds !== currentChapterStart) {
        let i = currentSeconds < currentChapterStart ? 0 : this.videoCurrentChapterIndex

        for (; i < chapters.length; i++) {
          if (currentSeconds < chapters[i].endSeconds) {
            this.videoCurrentChapterIndex = i
            break
          }
        }
      }
    },

    addToHistory: function (watchProgress) {
      const videoData = {
        videoId: this.videoId,
        title: this.videoTitle,
        author: this.channelName,
        authorId: this.channelId,
        published: this.videoPublished,
        description: this.videoDescription,
        viewCount: this.videoViewCount,
        lengthSeconds: this.videoLengthSeconds,
        watchProgress: watchProgress,
        timeWatched: Date.now(),
        isLive: false,
        type: 'video',
      }

      this.updateHistory(videoData)
    },

    handleWatchProgressManualSave() {
      // Should be called by manual action, settings should be checked in UI
      this._saveWatchProgress()
      showToast(this.$t('Video.Watched Progress Saved'))
    },
    handleWatchProgressAutoSave() {
      if (!this.rememberHistory || !this.autosaveWatchedProgress) { return }
      this._saveWatchProgress()
    },
    handleWatchProgressAutoSaveWhenProgressEnabled() {
      if (!this.rememberHistory || !this.watchedProgressSavingEnabled) { return }
      this._saveWatchProgress()
    },
    _saveWatchProgress() {
      if (!this.canSaveWatchProgress) { return }
      if (!this.$refs.player?.hasLoaded) { return }

      const currentTime = this.getWatchedProgress()
      const payload = {
        videoId: this.videoId,
        watchProgress: currentTime
      }
      this.updateWatchProgress(payload)
    },

    handlePlaylistPersisting: function () {
      // Only save playlist ID if enabled, and it's not special video types
      if (!(this.rememberHistory && this.saveVideoHistoryWithLastViewedPlaylist)) { return }
      if (this.isUpcoming || this.isLive) { return }

      this.updateLastViewedPlaylist({
        videoId: this.videoId,
        // Whether there is a playlist ID or not, save it
        lastViewedPlaylistId: this.playlistId,
        lastViewedPlaylistType: this.playlistType,
        lastViewedPlaylistItemId: this.playlistItemId,
      })
    },

    isRecommendedVideoWatched: function (videoId) {
      return !!this.$store.getters.getHistoryCacheById[videoId]
    },

    handleVideoLoaded: function () {
      // will trigger again if you switch formats or change legacy quality
      // Check isUpcoming to avoid marking upcoming videos as watched if the user has only watched the trailer
      if (!this.videoPlayerLoaded && !this.isUpcoming) {
        this.videoPlayerLoaded = true

        if (this.rememberHistory) {
          if (this.timestamp) {
            this.addToHistory(this.timestamp)
          } else if (this.historyEntryExists) {
            this.addToHistory(this.historyEntry.watchProgress)
          } else {
            this.addToHistory(0)
          }

          // Must be called AFTER history entry inserted
          // Otherwise the value is not saved for first time watched videos
          this.handlePlaylistPersisting()
        }

        this.updateLocalPlaylistLastPlayedAtSometimes()
      }
    },

    checkIfPlaylist: function () {
      if (this.$route.query == null) {
        this.watchingPlaylist = false
        return
      }

      this.playlistId = this.$route.query.playlistId
      this.playlistItemId = this.$route.query.playlistItemId

      if (this.playlistId == null || this.playlistId.length === 0) {
        this.playlistType = ''
        this.playlistItemId = null
        this.watchingPlaylist = false
        return
      }

      // `playlistId` present
      if (this.selectedUserPlaylist != null) {
        // If playlist ID matches a user playlist, it must be user playlist
        this.playlistType = 'user'
        this.watchingPlaylist = true
        return
      }

      // Still possible to be a user playlist from history
      // (but user playlist could be already removed)
      this.playlistType = this.$route.query.playlistType
      if (this.playlistType !== 'user') {
        // Remote playlist
        this.playlistItemId = null
        this.watchingPlaylist = true
        return
      }

      // At this point `playlistType === 'user'`
      // But the playlist might be already removed
      if (this.selectedUserPlaylist == null) {
        // Clear playlist data so that watch history will be properly updated
        this.playlistId = ''
        this.playlistType = ''
        this.playlistItemId = null
      }
      this.watchingPlaylist = this.selectedUserPlaylist != null
    },

    checkIfTimestamp: function () {
      const timestamp = parseInt(this.$route.query.timestamp)
      this.timestamp = isNaN(timestamp) || timestamp < 0 ? null : timestamp
    },

    handleFormatChange: function (format) {
      switch (format) {
        case 'dash':
          this.enableDashFormat()
          break
        case 'legacy':
          this.enableLegacyFormat()
          break
        case 'audio':
          this.enableAudioFormat()
          break
      }
    },

    enableDashFormat: function () {
      if (this.activeFormat === 'dash') {
        return
      }

      if (this.manifestSrc === null) {
        showToast(this.$t('Change Format.Dash formats are not available for this video'))
        return
      }

      this.activeFormat = 'dash'
    },

    enableLegacyFormat: function () {
      if (this.activeFormat === 'legacy') {
        return
      }

      if (this.isLive || this.isPostLiveDvr || this.legacyFormats.length === 0) {
        showToast(this.$t('Change Format.Legacy formats are not available for this video'))
        return
      }

      this.activeFormat = 'legacy'
    },

    enableAudioFormat: function () {
      if (this.activeFormat === 'audio') {
        return
      }

      if (this.manifestSrc === null ||
        ((this.isLive || this.isPostLiveDvr) &&
        // The WEB HLS manifests only contain combined audio and video files, so we can't do audio only
        // The IOS HLS manifests have audio-only streams
          this.manifestMimeType === MANIFEST_TYPE_HLS && !this.manifestSrc.includes('/demuxed/1'))) {
        showToast(this.$t('Change Format.Audio formats are not available for this video'))
        return
      }

      this.activeFormat = 'audio'
    },

    handleVideoEnded: function () {
      this.handleWatchProgressAutoSaveWhenProgressEnabled()
      if (!this.autoplayEnabled) {
        return
      }

      if (this.blockVideoAutoplay) {
        showToast(this.$t('Autoplay Interruption Timer',
          this.defaultAutoplayInterruptionIntervalHours,
          {
            autoplayInterruptionIntervalHours: this.defaultAutoplayInterruptionIntervalHours
          }),
        3_600_000
        )
        this.resetAutoplayInterruptionTimeout()
        return
      }

      if (this.watchingPlaylist && this.$refs.watchVideoPlaylist?.shouldStopDueToPlaylistEnd) {
        // Let `watchVideoPlaylist` handle end of playlist, no countdown needed
        this.$refs.watchVideoPlaylist.playNextVideo()
        return
      }

      let nextVideoId = null
      if (!this.watchingPlaylist) {
        nextVideoId = this.nextRecommendedVideo?.videoId
        if (!nextVideoId) {
          return
        }
      }

      const nextVideoInterval = this.defaultInterval
      this.playNextTimeout = setTimeout(() => {
        const player = this.$refs.player

        if (player?.isPaused()) {
          if (this.watchingPlaylist) {
            this.$refs.watchVideoPlaylist.playNextVideo()
          } else {
            this.$router.push({
              path: `/watch/${nextVideoId}`
            })
            showToast(this.$t('Playing Next Video'))
          }
        }
        this.playNextTimeout = null
      }, nextVideoInterval * 1000)

      if (nextVideoInterval > 0) {
        // No countdown for 0s interval
        showToast(
          ({ remainingMs }) => {
            const countDownTimeLeftInSecond = remainingMs / 1000
            return this.$t('Playing Next Video Interval', { nextVideoInterval: countDownTimeLeftInSecond }, countDownTimeLeftInSecond)
          },
          // So that we don't see last countdown text like 0/N
          nextVideoInterval * 1000,
          this.abortAutoplayCountdown,
        )
      }
    },

    // Skip to the next video if in a playlist
    // else next recommended video if autoplay enabled
    handleSkipToNext: function () {
      if (this.watchingPlaylist) {
        this.$refs.watchVideoPlaylist?.playNextVideo()
      } else if (!this.hideRecommendedVideos && this.nextRecommendedVideo) {
        this.$router.push({
          path: `/watch/${this.nextRecommendedVideo.videoId}`
        })
        showToast(this.$t('Playing Next Video'))
      }
    },

    // Skip to the previous video in a playlist
    handleSkipToPrev: function () {
      this.$refs.watchVideoPlaylist?.playPreviousVideo()
    },

    abortAutoplayCountdown: function (hideToast = false) {
      clearTimeout(this.playNextTimeout)
      clearInterval(this.playNextCountDownIntervalId)
      this.playNextTimeout = null

      if (!hideToast) {
        showToast(this.$t('Canceled next video autoplay'))
      }
    },

    handleRouteChange: function () {
      this.abortAutoplayCountdown(true)
      this.videoChapters = []
      this.videoChaptersKind = 'chapters'

      this.handleWatchProgressAutoSave()
    },

    /**
     * @param {import('shaka-player/dist/shaka-player.ui').default.util.Error} error
     */
    handlePlayerError: function (error) {
      // the error is logged to the console inside the player so we don't have to do it here

      const { Code } = shaka.util.Error

      if (error.code === Code.HTTP_ERROR) {
        if (error.data[1]?.message === 'Failed to fetch' && !navigator.onLine) {
          // Internet connection was lost, do nothing on our side as
          // shaka-player will keep trying until the internet connection returns and resume playback automatically when it does
          return
        }
      } else if (error.code === Code.BAD_HTTP_STATUS) {
        switch (error.data[1]) {
          case 429:
            this.handleWatchProgressAutoSaveWhenProgressEnabled()

            this.errorMessage = '[BAD_HTTP_STATUS: 429] Ratelimited'
            return
          case 403:
            this.handleWatchProgressAutoSaveWhenProgressEnabled()

            if (new Date() > this.streamingDataExpiryDate) {
              this.errorMessage = '[BAD_HTTP_STATUS: 403] YouTube watch session expired. Please reopen this video.'
              this.customErrorIcon = ['fas', 'clock']
              return
            }

            if (this.videoGenreIsMusic) {
              this.errorMessage = '[BAD_HTTP_STATUS: 403] Potential causes: IP block, streaming URL deciphering failed or music video geo-block'
            } else {
              this.errorMessage = '[BAD_HTTP_STATUS: 403] Potential causes: IP block or streaming URL deciphering failed'
            }
            return
        }
      } else if (error.code === Code.VIDEO_ERROR) {
        if (this.activeFormat === 'legacy') {
          if (new Date() > this.streamingDataExpiryDate) {
            this.handleWatchProgressAutoSaveWhenProgressEnabled()

            this.errorMessage = '[VIDEO_ERROR] YouTube watch session expired. Please reopen this video.'
            this.customErrorIcon = ['fas', 'clock']
            return
          }
        }
      }

      if (this.isLive || this.isPostLiveDvr) {
        // live streams don't have legacy formats, so only switch between dash and audio

        if (this.activeFormat === 'dash') {
          console.error('Unable to play DASH formats. Reverting to audio formats...')
          this.enableAudioFormat()
        } else {
          console.error('Unable to play audio formats. Reverting to DASH formats...')
          this.enableDashFormat()
        }
      } else {
        // loop through formats DASH -> legacy -> audio -> DASH

        switch (this.activeFormat) {
          case 'dash':
            console.error('Unable to play DASH formats. Reverting to legacy formats...')
            this.enableLegacyFormat()
            break
          case 'legacy':
            console.error('Unable to play legacy formats. Reverting to audio formats...')
            this.enableAudioFormat()
            break
          case 'audio':
            console.error('Unable to play audio formats. Reverting to DASH formats...')
            this.enableDashFormat()
            break
        }
      }
    },

    /**
     * @param {import('youtubei.js').YT.VideoInfo} videoInfo
     * @param {boolean} includeThumbnails
     */
    createLocalDashManifest: async function (videoInfo, includeThumbnails = false) {
      const xmlData = await videoInfo.toDash({
        manifest_options: {
          include_thumbnails: includeThumbnails,
        },
      })

      return `data:application/dash+xml;charset=UTF-8,${encodeURIComponent(xmlData)}`
    },

    createInvidiousDashManifest: async function (result) {
      let url = `${this.currentInvidiousInstanceUrl}/api/manifest/dash/id/${this.videoId}`

      // If we are in Electron,
      // we can use YouTube.js' DASH manifest generator to generate the manifest.
      // Using YouTube.js' gives us support for multiple audio tracks (currently not supported by Invidious)
      if (process.env.SUPPORTS_LOCAL_API) {
        const adaptiveFormats = await this.getAdaptiveFormatsInvidious(result)

        /** @type {import('youtubei.js').Misc.Format[]} */
        const formats = []

        /** @type {import('youtubei.js').Misc.Format[]} */
        const audioFormats = []

        let hasMultipleAudioTracks = false

        for (const format of adaptiveFormats) {
          const localFormat = convertInvidiousToLocalFormat(format)

          if (localFormat.has_audio) {
            audioFormats.push(localFormat)

            if (localFormat.is_dubbed || localFormat.is_descriptive || localFormat.is_secondary || localFormat.is_auto_dubbed) {
              hasMultipleAudioTracks = true
            }
          }

          formats.push(localFormat)
        }

        if (hasMultipleAudioTracks) {
          // match YouTube's local API response with English
          const languageNames = new Intl.DisplayNames('en-US', { type: 'language', languageDisplay: 'standard' })
          for (const format of audioFormats) {
            this.generateAudioTrackFieldInvidious(format, languageNames)
          }
        }

        const manifest = await generateInvidiousDashManifestLocally(formats)

        url = `data:application/dash+xml;charset=UTF-8,${encodeURIComponent(manifest)}`
      } else if (this.proxyVideos) {
        url += '?local=true'
      }

      return url
    },

    /**
     * @param {import('youtubei.js').Misc.Format} format
     * @param {Intl.DisplayNames} languageNames
     */
    generateAudioTrackFieldInvidious: function (format, languageNames) {
      let type = ''

      // use the same id numbers as YouTube (except -1, when we aren't sure what it is)
      let idNumber = ''

      if (format.is_descriptive) {
        type = ' descriptive'
        idNumber = 2
      } else if (format.is_dubbed) {
        type = ''
        idNumber = 3
      } else if (format.is_original) {
        type = ' original'
        idNumber = 4
      } else if (format.is_secondary) {
        type = ' secondary'
        idNumber = 6
      } else if (format.is_auto_dubbed) {
        type = ''
        idNumber = 10
      } else {
        type = ' alternative'
        idNumber = -1
      }

      const languageName = languageNames.of(format.language)

      format.audio_track = {
        audio_is_default: !!format.is_original,
        id: `${format.language}.${idNumber}`,
        display_name: `${languageName}${type}`
      }
    },

    getAdaptiveFormatsInvidious: async function (existingInfoResult = null) {
      let result
      if (existingInfoResult) {
        result = existingInfoResult
      } else {
        result = await invidiousGetVideoInformation(this.videoId)
      }

      result.adaptiveFormats.forEach((format) => {
        format.bitrate = parseInt(format.bitrate)

        // audio streams don't have a size property
        if (typeof format.size === 'string') {
          const [stringWidth, stringHeight] = format.size.split('x')

          format.width = parseInt(stringWidth)
          format.height = parseInt(stringHeight)
        }
      })

      return result.adaptiveFormats
    },

    /**
     * @param {import('youtubei.js/dist/src/parser/classes/PlayerStoryboardSpec').StoryboardData} storyboardInfo
     * @returns {string}
     */
    createLocalStoryboardUrls: function (storyboardInfo) {
      const results = buildVTTFileLocally(storyboardInfo, this.videoLengthSeconds)

      return `data:text/vtt;charset=utf-8,${encodeURIComponent(results)}`
    },

    /**
     * @param {import('youtubei.js').YTNodes.PlayerCaptionsTracklist} captions
     * @param {Set<string>} userLanguages
     * @returns {null|{ url: string, label: string, language: string, mimeType: string, isAutotranslated: boolean }}
     */
    getTranslatedLocaleCaption: function (captions, userLanguages) {
      // check if we can translate to the users language
      const translationLanguage = captions.translation_languages.find(language => userLanguages.has(language.language_code))

      let translationName, translationCode
      // otherwise just fallback to the FreeTube display language and hope that YouTube will be able to handle it
      if (!translationLanguage) {
        translationName = this.$t('Locale Name')
        translationCode = userLanguages.values().next().value
      } else {
        translationName = translationLanguage.language_name.text
        translationCode = translationLanguage.language_code
      }

      let trackToTranslate

      const autoGeneratedCaptionTrack = captions.caption_tracks.find(track => track.kind === 'asr')
      if (autoGeneratedCaptionTrack) {
        // Check if there is a user uploaded caption track in the language of the video, as that is more trustworthy than auto-generated captions
        const userUploadedCaptionTrack = captions.caption_tracks.find(track => track.kind !== 'asr' && track.language_code === autoGeneratedCaptionTrack.language_code)

        // Fallback to the auto-generated track if there is no user uploaded one that matches the video language
        trackToTranslate = userUploadedCaptionTrack ?? autoGeneratedCaptionTrack
      } else {
        // if there is no auto-generated track choose the first translatable track
        trackToTranslate = captions.caption_tracks.find(track => track.is_translatable) ?? captions.caption_tracks[0]
      }

      const url = new URL(trackToTranslate.base_url)
      // Requesting fmt=vtt with the tlang parameter set returns HTTP 429 errors, but requesting srt instead seems to work
      url.searchParams.set('fmt', 'srt')
      url.searchParams.set('tlang', translationCode)

      const label = this.$t('Video.Player.TranslatedCaptionTemplate', {
        language: translationName,
        originalLanguage: trackToTranslate.name.text
      })

      return {
        url: url.toString(),
        label,
        language: translationCode,
        mimeType: 'text/srt',
        isAutotranslated: true
      }
    },

    pausePlayer: function () {
      const player = this.$refs.player

      if (player && !player.isPaused()) {
        player.pause()
      }
    },

    getWatchedProgress: function () {
      const player = this.$refs.player

      if (!this.isLoading && player?.hasLoaded) {
        return player.getCurrentTime()
      }

      return 0
    },

    getTimestamp: function () {
      return Math.floor(this.getWatchedProgress())
    },

    getPlaylistIndex: function () {
      return this.$refs.watchVideoPlaylist
        ? this.getPlaylistReverse()
          ? this.$refs.watchVideoPlaylist.playlistItems.length - this.$refs.watchVideoPlaylist.currentVideoIndexOneBased
          : this.$refs.watchVideoPlaylist.currentVideoIndexZeroBased
        : -1
    },

    getPlaylistReverse: function () {
      return this.$refs.watchVideoPlaylist ? this.$refs.watchVideoPlaylist.reversePlaylist : false
    },

    getPlaylistShuffle: function () {
      return this.$refs.watchVideoPlaylist ? this.$refs.watchVideoPlaylist.shuffleEnabled : false
    },

    getPlaylistLoop: function () {
      return this.$refs.watchVideoPlaylist ? this.$refs.watchVideoPlaylist.loopEnabled : false
    },

    updateTitle: function () {
      this.setAppTitle(`${this.videoTitle} - ${packageDetails.productName}`)
    },

    isHiddenVideo: function (forbiddenTitles, channelsHidden, video) {
      return channelsHidden.some(ch => ch.name === video.authorId) ||
        channelsHidden.some(ch => ch.name === video.author) ||
        forbiddenTitles.some((text) => video.title?.toLowerCase().includes(text)) ||
        forbiddenTitles.some((text) => video.author?.toLowerCase().includes(text))
    },

    toggleAutoplay: function() {
      if (this.autoplayEnabled && this.playNextTimeout) {
        this.abortAutoplayCountdown()
      }

      if (this.watchingPlaylist) {
        this.autoplayNextPlaylistVideo = !this.autoplayEnabled
      } else {
        this.autoplayNextRecommendedVideo = !this.autoplayEnabled
      }
    },

    updateLocalPlaylistLastPlayedAtSometimes() {
      if (this.selectedUserPlaylist == null) { return }

      const playlist = this.selectedUserPlaylist
      this.updatePlaylistLastPlayedAt({ _id: playlist._id })
    },

    resetAutoplayInterruptionTimeout() {
      clearTimeout(this.autoplayInterruptionTimeout)
      this.autoplayInterruptionTimeout = setTimeout(() => { this.blockVideoAutoplay = true }, this.defaultAutoplayInterruptionIntervalHours * 3_600_000)
      this.blockVideoAutoplay = false
    },

    updatePlaybackRate(newRate) {
      this.currentPlaybackRate = newRate
    },

    destroyPlayer: async function() {
      const uiState = await this.$refs.player.destroyPlayer()
      this.startNextVideoInFullscreen = uiState.startNextVideoInFullscreen
      this.startNextVideoInFullwindow = uiState.startNextVideoInFullwindow
      this.startNextVideoInPip = uiState.startNextVideoInPip
    },

    ...mapActions([
      'updateHistory',
      'updateWatchProgress',
      'updateLastViewedPlaylist',
      'updatePlaylistLastPlayedAt',
      'updateSubscriptionDetails',
    ]),

    ...mapMutations([
      'setAppTitle'
    ])
  }
})
