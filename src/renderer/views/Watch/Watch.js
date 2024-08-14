import { defineComponent } from 'vue'
import { mapActions } from 'vuex'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtVideoPlayer from '../../components/ft-video-player/ft-video-player.vue'
import WatchVideoInfo from '../../components/watch-video-info/watch-video-info.vue'
import WatchVideoChapters from '../../components/WatchVideoChapters/WatchVideoChapters.vue'
import WatchVideoDescription from '../../components/WatchVideoDescription/WatchVideoDescription.vue'
import WatchVideoComments from '../../components/watch-video-comments/watch-video-comments.vue'
import WatchVideoLiveChat from '../../components/watch-video-live-chat/watch-video-live-chat.vue'
import WatchVideoPlaylist from '../../components/watch-video-playlist/watch-video-playlist.vue'
import WatchVideoRecommendations from '../../components/WatchVideoRecommendations/WatchVideoRecommendations.vue'
import FtAgeRestricted from '../../components/ft-age-restricted/ft-age-restricted.vue'
import packageDetails from '../../../../package.json'
import {
  buildVTTFileLocally,
  copyToClipboard,
  formatDurationAsTimestamp,
  formatNumber,
  getFormatsFromHLSManifest,
  showToast
} from '../../helpers/utils'
import {
  filterLocalFormats,
  getLocalVideoInfo,
  mapLocalFormat,
  parseLocalSubscriberCount,
  parseLocalTextRuns,
  parseLocalWatchNextVideo
} from '../../helpers/api/local'
import {
  convertInvidiousToLocalFormat,
  filterInvidiousFormats,
  generateInvidiousDashManifestLocally,
  invidiousFetch,
  invidiousGetVideoInformation,
  youtubeImageUrlToInvidious
} from '../../helpers/api/invidious'

/**
 * @typedef {object} AudioSource
 * @property {string} url
 * @property {string} type
 * @property {string} label
 * @property {string} qualityLabel
 *
 * @typedef {object} AudioTrack
 * @property {string} id
 * @property {('main'|'translation'|'descriptions'|'alternative')} kind - https://videojs.com/guides/audio-tracks/#kind
 * @property {string} label
 * @property {string} language
 * @property {boolean} isDefault
 * @property {AudioSource[]} sourceList
 */

export default defineComponent({
  name: 'Watch',
  components: {
    'ft-loader': FtLoader,
    'ft-video-player': FtVideoPlayer,
    'watch-video-info': WatchVideoInfo,
    'watch-video-chapters': WatchVideoChapters,
    'watch-video-description': WatchVideoDescription,
    'watch-video-comments': WatchVideoComments,
    'watch-video-live-chat': WatchVideoLiveChat,
    'watch-video-playlist': WatchVideoPlaylist,
    'watch-video-recommendations': WatchVideoRecommendations,
    'ft-age-restricted': FtAgeRestricted
  },
  beforeRouteLeave: function (to, from, next) {
    this.handleRouteChange(this.videoId)
    window.removeEventListener('beforeunload', this.handleWatchProgress)
    next()
  },
  data: function () {
    return {
      isLoading: true,
      firstLoad: true,
      useTheatreMode: false,
      videoPlayerReady: false,
      hidePlayer: false,
      isFamilyFriendly: false,
      isLive: false,
      liveChat: null,
      isLiveContent: false,
      isUpcoming: false,
      isPostLiveDvr: false,
      upcomingTimestamp: null,
      upcomingTimeLeft: null,
      activeFormat: 'legacy',
      thumbnail: '',
      videoId: '',
      videoTitle: '',
      videoDescription: '',
      videoDescriptionHtml: '',
      videoViewCount: 0,
      videoLikeCount: 0,
      videoDislikeCount: 0,
      videoLengthSeconds: 0,
      videoChapters: [],
      videoCurrentChapterIndex: 0,
      channelName: '',
      channelThumbnail: '',
      channelId: '',
      channelSubscriptionCountText: '',
      videoPublished: 0,
      videoStoryboardSrc: '',
      dashSrc: [],
      activeSourceList: [],
      videoSourceList: [],
      audioSourceList: [],
      /**
       * @type {AudioTrack[]}
       */
      audioTracks: [],
      adaptiveFormats: [],
      captionHybridList: [], // [] -> Promise[] -> string[] (URIs)
      recommendedVideos: [],
      downloadLinks: [],
      watchingPlaylist: false,
      playlistId: '',
      playlistType: '',
      playlistItemId: null,
      timestamp: null,
      playNextTimeout: null,
      playNextCountDownIntervalId: null,
      infoAreaSticky: true,
      commentsEnabled: true,

      onMountedRun: false,
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
    saveWatchedProgress: function () {
      return this.$store.getters.getSaveWatchedProgress
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
    defaultInterval: function () {
      return this.$store.getters.getDefaultInterval
    },
    defaultTheatreMode: function () {
      return this.$store.getters.getDefaultTheatreMode
    },
    defaultVideoFormat: function () {
      return this.$store.getters.getDefaultVideoFormat
    },
    forceLocalBackendForLegacy: function () {
      return this.$store.getters.getForceLocalBackendForLegacy
    },
    thumbnailPreference: function () {
      return this.$store.getters.getThumbnailPreference
    },
    playNextVideo: function () {
      return this.$store.getters.getPlayNextVideo
    },
    autoplayPlaylists: function () {
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
    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
    },
    hideChapters: function () {
      return this.$store.getters.getHideChapters
    },
    allowDashAv1Formats: function () {
      return this.$store.getters.getAllowDashAv1Formats
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
      return JSON.parse(this.$store.getters.getForbiddenTitles)
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
  },
  watch: {
    $route() {
      this.handleRouteChange(this.videoId)
      // react to route changes...
      this.videoId = this.$route.params.id

      this.firstLoad = true
      this.videoPlayerReady = false
      this.activeFormat = this.defaultVideoFormat
      this.videoStoryboardSrc = ''
      this.captionHybridList = []
      this.downloadLinks = []
      this.videoCurrentChapterIndex = 0
      this.audioTracks = []

      this.checkIfPlaylist()
      this.checkIfTimestamp()

      switch (this.backendPreference) {
        case 'local':
          this.getVideoInformationLocal(this.videoId)
          break
        case 'invidious':
          this.getVideoInformationInvidious(this.videoId)

          if (this.forceLocalBackendForLegacy) {
            this.getVideoInformationLocal(this.videoId)
          }
          break
      }
    },
    userPlaylistsReady() {
      this.onMountedDependOnLocalStateLoading()
    },
  },
  mounted: function () {
    this.videoId = this.$route.params.id
    this.activeFormat = this.defaultVideoFormat
    this.useTheatreMode = this.defaultTheatreMode && this.theatrePossible

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
      this.checkIfTimestamp()

      if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious') {
        this.getVideoInformationInvidious()
      } else {
        this.getVideoInformationLocal()
      }

      window.addEventListener('beforeunload', this.handleWatchProgress)
    },

    changeTimestamp: function (timestamp) {
      this.$refs.videoPlayer.player.currentTime(timestamp)
    },

    getVideoInformationLocal: async function () {
      if (this.firstLoad) {
        this.isLoading = true
      }

      try {
        const result = await getLocalVideoInfo(this.videoId)

        this.isFamilyFriendly = result.basic_info.is_family_safe

        const recommendedVideos = result.watch_next_feed
          ?.filter((item) => item.type === 'CompactVideo' || item.type === 'CompactMovie')
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

        const playabilityStatus = result.playability_status

        if (playabilityStatus.status === 'UNPLAYABLE') {
          /**
           * @type {import ('youtubei.js').YTNodes.PlayerErrorMessage}
           */
          const errorScreen = playabilityStatus.error_screen
          throw new Error(`[${playabilityStatus.status}] ${errorScreen.reason.text}: ${errorScreen.subreason.text}`)
        }

        // extract localised title first and fall back to the not localised one
        this.videoTitle = result.primary_info?.title.text ?? result.basic_info.title
        this.videoViewCount = result.basic_info.view_count

        this.channelId = result.basic_info.channel_id
        this.channelName = result.basic_info.author

        if (result.secondary_info.owner?.author) {
          this.channelThumbnail = result.secondary_info.owner.author.best_thumbnail?.url ?? ''
        } else {
          this.channelThumbnail = ''
        }

        this.updateSubscriptionDetails({
          channelThumbnailUrl: this.channelThumbnail.length === 0 ? null : this.channelThumbnail,
          channelName: this.channelName,
          channelId: this.channelId
        })

        // `result.page[0].microformat.publish_date` example value: `2023-08-12T08:59:59-07:00`
        this.videoPublished = new Date(result.page[0].microformat.publish_date).getTime()

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
            this.thumbnail = result.basic_info.thumbnail[0].url
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

        const subCount = !result.secondary_info.owner.subscriber_count.isEmpty() ? parseLocalSubscriberCount(result.secondary_info.owner.subscriber_count.text) : NaN

        if (!isNaN(subCount)) {
          this.channelSubscriptionCountText = formatNumber(subCount, subCount >= 10000 ? { notation: 'compact' } : undefined)
        } else {
          this.channelSubscriptionCountText = ''
        }

        let chapters = []
        if (!this.hideChapters) {
          const rawChapters = result.player_overlays?.decorated_player_bar?.player_bar?.markers_map?.get({ marker_key: 'DESCRIPTION_CHAPTERS' })?.value.chapters
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
            chapters = this.extractChaptersFromDescription(result.basic_info.short_description)
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

        if (!this.hideLiveChat && this.isLive && result.livechat) {
          this.liveChat = result.getLiveChat()
        } else {
          this.liveChat = null
        }

        // region No comment detection
        // For videos without any comment (comment disabled?)
        // e.g. https://youtu.be/8NBSwDEf8a8
        //
        // `comments_entry_point_header` is null probably when comment disabled
        // e.g. https://youtu.be/8NBSwDEf8a8
        // However videos with comments enabled but have no comment
        // are different (which is not detected here)
        this.commentsEnabled = result.comments_entry_point_header != null
        // endregion No comment detection

        if ((this.isLive || this.isPostLiveDvr) && !this.isUpcoming) {
          try {
            const formats = await getFormatsFromHLSManifest(result.streaming_data.hls_manifest_url)

            this.videoSourceList = formats
              .sort((formatA, formatB) => {
                return formatB.height - formatA.height
              })
              .map((format) => {
                return {
                  url: format.url,
                  fps: format.fps,
                  type: 'application/x-mpegURL',
                  label: 'Dash',
                  qualityLabel: `${format.height}p`
                }
              })
          } catch (e) {
            console.error('Failed to extract formats form HLS manifest, falling back to passing it directly to video.js', e)

            this.videoSourceList = [
              {
                url: result.streaming_data.hls_manifest_url,
                type: 'application/x-mpegURL',
                label: 'Dash',
                qualityLabel: 'Live'
              }
            ]
          }

          this.activeFormat = 'legacy'
          this.activeSourceList = this.videoSourceList
          this.audioSourceList = null
          this.dashSrc = null
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
          } else {
            this.upcomingTimestamp = null
            this.upcomingTimeLeft = null
          }
        } else {
          this.videoLengthSeconds = result.basic_info.duration
          if (result.streaming_data) {
            if (result.streaming_data.formats.length > 0) {
              this.videoSourceList = result.streaming_data.formats.map(mapLocalFormat).reverse()
            } else {
              this.videoSourceList = filterLocalFormats(result.streaming_data.adaptive_formats, this.allowDashAv1Formats).map(mapLocalFormat).reverse()
            }
            this.adaptiveFormats = this.videoSourceList

            /** @type {import('../../helpers/api/local').LocalFormat[]} */
            const formats = [...result.streaming_data.formats, ...result.streaming_data.adaptive_formats]
            this.downloadLinks = formats.map((format) => {
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

              return {
                url: format.freeTubeUrl,
                label: label
              }
            })

            if (result.captions) {
              const captionTracks = result.captions.caption_tracks.map((caption) => {
                return {
                  url: caption.base_url,
                  label: caption.name.text,
                  language_code: caption.language_code,
                  kind: caption.kind
                }
              })
              if (this.currentLocale) {
                const noLocaleCaption = !captionTracks.some(track =>
                  track.language_code === this.currentLocale && track.kind !== 'asr'
                )

                if (!this.currentLocale.startsWith('en') && noLocaleCaption) {
                  captionTracks.forEach((caption) => {
                    this.tryAddingTranslatedLocaleCaption(captionTracks, this.currentLocale, caption.url)
                  })
                }
              }

              this.captionHybridList = this.createCaptionPromiseList(captionTracks)

              const captionLinks = captionTracks.map((caption) => {
                const label = `${caption.label} (${caption.language_code}) - text/vtt`

                return {
                  url: caption.url,
                  label: label
                }
              })

              this.downloadLinks = this.downloadLinks.concat(captionLinks)
            }
          } else {
            // video might be region locked or something else. This leads to no formats being available
            showToast(
              this.$t('This video is unavailable because of missing formats. This can happen due to country unavailability.'),
              7000
            )
            this.handleVideoEnded()
            return
          }

          if (result.streaming_data?.adaptive_formats.length > 0) {
            const audioFormats = result.streaming_data.adaptive_formats.filter((format) => {
              return format.has_audio
            })

            const hasMultipleAudioTracks = audioFormats.some(format => format.audio_track)

            if (hasMultipleAudioTracks) {
              const audioTracks = this.createAudioTracksFromLocalFormats(audioFormats)

              this.audioTracks = audioTracks

              this.audioSourceList = audioTracks.find(track => track.isDefault).sourceList
            } else {
              this.audioTracks = []

              this.audioSourceList = this.createLocalAudioSourceList(audioFormats)
            }

            // we need to alter the result object so the toDash function uses the filtered formats too
            result.streaming_data.adaptive_formats = filterLocalFormats(result.streaming_data.adaptive_formats, this.allowDashAv1Formats)

            // When `this.proxyVideos` is true
            // It's possible that the Invidious instance used, only supports a subset of the formats from Local API
            // i.e. the value passed into `adaptiveFormats`
            // e.g. Supports 720p60, but not 720p - https://[DOMAIN_NAME]/api/manifest/dash/id/v3wm83zoSSY?local=true
            if (this.proxyVideos) {
              this.adaptiveFormats = await this.getAdaptiveFormatsInvidious()
              this.dashSrc = await this.createInvidiousDashManifest()
            } else {
              this.adaptiveFormats = result.streaming_data.adaptive_formats.map(mapLocalFormat)
              this.dashSrc = await this.createLocalDashManifest(result)
            }

            if (this.activeFormat === 'audio') {
              this.activeSourceList = this.audioSourceList
            } else {
              this.activeSourceList = this.videoSourceList
            }
          } else {
            this.activeSourceList = this.videoSourceList
            this.audioSourceList = null
            this.dashSrc = null
            this.enableLegacyFormat()
          }

          if (result.storyboards?.type === 'PlayerStoryboardSpec') {
            let source = result.storyboards.boards
            if (window.innerWidth < 500) {
              source = source.filter((board) => board.thumbnail_height <= 90)
            }
            this.createLocalStoryboardUrls(source.at(-1))
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
          // Invidious doesn't support multiple audio tracks, so we need to clear this to prevent the player getting confused
          this.audioTracks = []
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

      this.videoStoryboardSrc = `${this.currentInvidiousInstanceUrl}/api/v1/storyboards/${this.videoId}?height=90`

      invidiousGetVideoInformation(this.videoId)
        .then(async result => {
          if (result.error) {
            throw new Error(result.error)
          }

          this.videoTitle = result.title
          this.videoViewCount = result.viewCount
          this.channelSubscriptionCountText = isNaN(result.subCountText) ? '' : result.subCountText
          if (this.hideVideoLikesAndDislikes) {
            this.videoLikeCount = null
            this.videoDislikeCount = null
          } else {
            this.videoLikeCount = result.likeCount
            this.videoDislikeCount = result.dislikeCount
          }

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
          // place watched recommended videos last
          this.recommendedVideos = [
            ...recommendedVideos.filter((video) => !this.isRecommendedVideoWatched(video.videoId)),
            ...recommendedVideos.filter((video) => this.isRecommendedVideoWatched(video.videoId))
          ]
          this.adaptiveFormats = await this.getAdaptiveFormatsInvidious(result)
          this.isLive = result.liveNow
          this.isFamilyFriendly = result.isFamilyFriendly
          this.captionHybridList = result.captions.map(caption => {
            caption.url = this.currentInvidiousInstanceUrl + caption.url
            caption.type = ''
            caption.dataSource = 'invidious'
            return caption
          })

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

          if (this.isLive) {
            this.activeFormat = 'legacy'

            this.videoSourceList = [
              {
                url: result.hlsUrl,
                type: 'application/x-mpegURL',
                label: 'Dash',
                qualityLabel: 'Live'
              }
            ]

            // Grabs the adaptive formats from Invidious.  Might be worth making these work.
            // The type likely needs to be changed in order for these to be played properly.
            // this.videoSourceList = result.adaptiveFormats.filter((format) => {
            //   if (typeof (format.type) !== 'undefined') {
            //     return format.type.includes('video/mp4')
            //   }
            // }).map((format) => {
            //   return {
            //     url: format.url,
            //     type: 'application/x-mpegURL',
            //     label: 'Dash',
            //     qualityLabel: format.qualityLabel
            //   }
            // })

            this.activeSourceList = this.videoSourceList
          } else if (this.forceLocalBackendForLegacy) {
            this.getLegacyFormats()
          } else {
            this.videoLengthSeconds = result.lengthSeconds
            this.videoSourceList = result.formatStreams.reverse()

            this.downloadLinks = result.adaptiveFormats.concat(this.videoSourceList).map((format) => {
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
                url: format.url,
                label: label
              }

              return object
            }).reverse().concat(result.captions.map((caption) => {
              const label = `${caption.label} (${caption.languageCode}) - text/vtt`
              const object = {
                url: caption.url,
                label: label
              }

              return object
            }))

            this.audioTracks = []
            this.dashSrc = await this.createInvidiousDashManifest()

            if (process.env.SUPPORTS_LOCAL_API && this.audioTracks.length > 0) {
              // when the local API is supported and the video has multiple audio tracks,
              // we populate the list inside createInvidiousDashManifest
              // as we need to work out the different audio tracks for the DASH manifest anyway
              this.audioSourceList = this.audioTracks.find(track => track.isDefault).sourceList
            } else {
              this.audioSourceList = result.adaptiveFormats.filter((format) => {
                return format.type.includes('audio')
              }).map((format) => {
                return {
                  url: format.url,
                  type: format.type,
                  label: 'Audio',
                  qualityLabel: parseInt(format.bitrate)
                }
              }).sort((a, b) => {
                return a.qualityLabel - b.qualityLabel
              })
            }

            if (this.activeFormat === 'audio') {
              this.activeSourceList = this.audioSourceList
            } else {
              this.activeSourceList = this.videoSourceList
            }
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

    /**
     * @param {string} description
     */
    extractChaptersFromDescription: function (description) {
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

    updateCurrentChapter: function () {
      const chapters = this.videoChapters
      const currentSeconds = this.getTimestamp()
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

    /**
     * @param {import('../../helpers/api/local').LocalFormat[]} audioFormats
     * @returns {AudioTrack[]}
     */
    createAudioTracksFromLocalFormats: function (audioFormats) {
      /** @type {string[]} */
      const ids = []

      /** @type {AudioTrack[]} */
      const audioTracks = []

      /** @type {import('youtubei.js').Misc.Format[][]} */
      const sourceLists = []

      for (const format of audioFormats) {
        // Some videos with multiple audio tracks, have a broken one, that doesn't have any audio track information
        // It seems to be the same as default audio track but broken
        // At the time of writing, this video has a broken audio track: https://youtu.be/UJeSWbR6W04
        if (!format.audio_track) {
          continue
        }

        const index = ids.indexOf(format.audio_track.id)
        if (index === -1) {
          ids.push(format.audio_track.id)

          let kind

          if (format.audio_track.audio_is_default) {
            kind = 'main'
          } else if (format.is_dubbed) {
            kind = 'translation'
          } else if (format.is_descriptive) {
            kind = 'descriptions'
          } else {
            kind = 'alternative'
          }

          audioTracks.push({
            id: format.audio_track.id,
            kind,
            label: format.audio_track.display_name,
            language: format.language,
            isDefault: format.audio_track.audio_is_default,
            sourceList: []
          })

          sourceLists.push([
            format
          ])
        } else {
          sourceLists[index].push(format)
        }
      }

      for (let i = 0; i < audioTracks.length; i++) {
        audioTracks[i].sourceList = this.createLocalAudioSourceList(sourceLists[i])
      }

      return audioTracks
    },

    /**
     * @param {import('../../helpers/api/local').LocalFormat[]} audioFormats
     * @returns {AudioSource[]}
     */
    createLocalAudioSourceList: function (audioFormats) {
      return audioFormats.sort((a, b) => {
        return a.bitrate - b.bitrate
      }).map((format, index) => {
        let label

        switch (index) {
          case 0:
            label = this.$t('Video.Audio.Low')
            break
          case 1:
            label = this.$t('Video.Audio.Medium')
            break
          case 2:
            label = this.$t('Video.Audio.High')
            break
          case 3:
            label = this.$t('Video.Audio.Best')
            break
          default:
            label = format.bitrate.toString()
        }

        return {
          url: format.freeTubeUrl,
          type: format.mime_type,
          label: 'Audio',
          qualityLabel: label
        }
      }).reverse()
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
        timeWatched: new Date().getTime(),
        isLive: false,
        type: 'video',
      }

      this.updateHistory(videoData)
    },

    handleWatchProgress: function () {
      if (this.rememberHistory && !this.isUpcoming && !this.isLoading && !this.isLive) {
        const player = this.$refs.videoPlayer?.player

        if (player && this.saveWatchedProgress) {
          const currentTime = this.getWatchedProgress()
          const payload = {
            videoId: this.videoId,
            watchProgress: currentTime
          }
          this.updateWatchProgress(payload)
        }
      }
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

    handleVideoReady: function () {
      this.videoPlayerReady = true
      this.checkIfWatched()
      this.updateLocalPlaylistLastPlayedAtSometimes()
    },

    isRecommendedVideoWatched: function (videoId) {
      return !!this.$store.getters.getHistoryCacheById[videoId]
    },

    checkIfWatched: function () {
      if (!this.isLive) {
        if (this.timestamp) {
          if (this.timestamp < 0) {
            this.$refs.videoPlayer.player.currentTime(0)
          } else if (this.timestamp > (this.videoLengthSeconds - 10)) {
            this.$refs.videoPlayer.player.currentTime(this.videoLengthSeconds - 10)
          } else {
            this.$refs.videoPlayer.player.currentTime(this.timestamp)
          }
        } else if (this.saveWatchedProgress && this.historyEntryExists) {
          // For UX consistency, no progress reading if writing disabled
          const watchProgress = this.historyEntry.watchProgress

          if (watchProgress < (this.videoLengthSeconds - 10)) {
            this.$refs.videoPlayer.player.currentTime(watchProgress)
          }
        }
      }

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
    },

    checkIfPlaylist: function () {
      // On the off chance that user selected pause on current video
      // Then clicks on another video in the playlist
      this.disablePlaylistPauseOnCurrent()

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

    getLegacyFormats: function () {
      getLocalVideoInfo(this.videoId)
        .then(result => {
          this.videoSourceList = result.streaming_data.formats.map(mapLocalFormat)
        })
        .catch(err => {
          const errorMessage = this.$t('Local API Error (Click to copy)')
          showToast(`${errorMessage}: ${err}`, 10000, () => {
            copyToClipboard(err)
          })
          console.error(err)
          if (!process.env.SUPPORTS_LOCAL_API || (this.backendPreference === 'local' && this.backendFallback)) {
            showToast(this.$t('Falling back to Invidious API'))
            this.getVideoInformationInvidious()
          }
        })
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

      if (this.dashSrc === null || this.isLive || this.isPostLiveDvr) {
        showToast(this.$t('Change Format.Dash formats are not available for this video'))
        return
      }
      const watchedProgress = this.getWatchedProgress()
      this.activeFormat = 'dash'
      this.hidePlayer = true

      setTimeout(() => {
        this.hidePlayer = false
        setTimeout(() => {
          const player = this.$refs.videoPlayer.player
          if (player !== null) {
            player.currentTime(watchedProgress)
          }
        }, 500)
      }, 100)
    },

    enableLegacyFormat: function () {
      if (this.activeFormat === 'legacy') {
        return
      }

      const watchedProgress = this.getWatchedProgress()
      this.activeFormat = 'legacy'
      this.activeSourceList = this.videoSourceList
      this.hidePlayer = true

      setTimeout(() => {
        this.hidePlayer = false
        setTimeout(() => {
          const player = this.$refs.videoPlayer.player
          if (player !== null) {
            player.currentTime(watchedProgress)
          }
        }, 500)
      }, 100)
    },

    enableAudioFormat: function () {
      if (this.activeFormat === 'audio') {
        return
      }

      if (this.audioSourceList === null) {
        showToast(this.$t('Change Format.Audio formats are not available for this video'))
        return
      }

      const watchedProgress = this.getWatchedProgress()
      this.activeFormat = 'audio'
      this.activeSourceList = this.audioSourceList
      this.hidePlayer = true

      setTimeout(() => {
        this.hidePlayer = false
        setTimeout(() => {
          const player = this.$refs.videoPlayer.player
          if (player !== null) {
            player.currentTime(watchedProgress)
          }
        }, 500)
      }, 100)
    },

    handleVideoEnded: function () {
      if ((!this.watchingPlaylist || !this.autoplayPlaylists) && !this.playNextVideo) {
        return
      }

      if (this.watchingPlaylist && this.getPlaylistPauseOnCurrent()) {
        this.disablePlaylistPauseOnCurrent()
        return
      }

      if (this.watchingPlaylist && this.$refs.watchVideoPlaylist?.shouldStopDueToPlaylistEnd) {
        // Let `watchVideoPlaylist` handle end of playlist, no countdown needed
        this.$refs.watchVideoPlaylist.playNextVideo()
        return
      }

      let nextVideoId = null
      if (!this.watchingPlaylist) {
        const forbiddenTitles = this.forbiddenTitles
        const channelsHidden = this.channelsHidden
        nextVideoId = this.recommendedVideos.find((video) =>
          !this.isHiddenVideo(forbiddenTitles, channelsHidden, video)
        )?.videoId
        if (!nextVideoId) {
          return
        }
      }

      const nextVideoInterval = this.defaultInterval
      this.playNextTimeout = setTimeout(() => {
        const player = this.$refs.videoPlayer?.player
        if (player && player.paused()) {
          if (this.watchingPlaylist) {
            this.$refs.watchVideoPlaylist.playNextVideo()
          } else {
            this.$router.push({
              path: `/watch/${nextVideoId}`
            })
            showToast(this.$t('Playing Next Video'))
          }
        }
      }, nextVideoInterval * 1000)

      let countDownTimeLeftInSecond = nextVideoInterval
      const showCountDownMessage = () => {
        // Will not display "Playing next video in no time" as it's too late to cancel
        // Also there is a separate message when playing next video
        if (countDownTimeLeftInSecond <= 0) {
          clearInterval(this.playNextCountDownIntervalId)
          return
        }

        // To avoid message flashing
        // `time` is manually tested to be 700
        const message = this.$tc('Playing Next Video Interval', countDownTimeLeftInSecond, { nextVideoInterval: countDownTimeLeftInSecond })
        showToast(message, 700, () => {
          clearTimeout(this.playNextTimeout)
          clearInterval(this.playNextCountDownIntervalId)
          showToast(this.$t('Canceled next video autoplay'))
        })

        // At least this var should be updated AFTER showing the message
        countDownTimeLeftInSecond = countDownTimeLeftInSecond - 1
      }
      // Execute once before scheduling it
      showCountDownMessage()
      this.playNextCountDownIntervalId = setInterval(showCountDownMessage, 1000)
    },

    handleRouteChange: function (videoId) {
      // receiving it as an arg instead of accessing it ourselves means we always have the right one

      clearTimeout(this.playNextTimeout)
      clearInterval(this.playNextCountDownIntervalId)
      this.videoChapters = []

      this.handleWatchProgress()

      if (!this.isUpcoming && !this.isLoading) {
        const player = this.$refs.videoPlayer?.player

        if (player && !player.paused() && player.isInPictureInPicture()) {
          setTimeout(() => {
            player.play()
            player.on('leavepictureinpicture', (event) => {
              const watchTime = player.currentTime()
              if (this.$route.fullPath.includes('/watch')) {
                const routeId = this.$route.params.id
                if (routeId === videoId) {
                  this.$refs.videoPlayer.$refs.video.currentTime = watchTime
                }
              }

              player.pause()
              player.dispose()
            })
          }, 200)
        }
      }

      if (this.videoStoryboardSrc.startsWith('blob:')) {
        URL.revokeObjectURL(this.videoStoryboardSrc)
        this.videoStoryboardSrc = ''
      }
    },

    handleVideoError: function (error) {
      console.error(error)
      if (this.isLive) {
        return
      }

      if (error.code === 4) {
        if (this.activeFormat === 'dash') {
          console.warn(
            'Unable to play dash formats.  Reverting to legacy formats...'
          )
          this.enableLegacyFormat()
        } else {
          this.enableDashFormat()
        }
      }
    },

    /**
     * @param {import('youtubei.js').YT.VideoInfo} videoInfo
     */
    createLocalDashManifest: async function (videoInfo) {
      const xmlData = await videoInfo.toDash()

      return [
        {
          url: `data:application/dash+xml;charset=UTF-8,${encodeURIComponent(xmlData)}`,
          type: 'application/dash+xml',
          label: 'Dash',
          qualityLabel: 'Auto'
        }
      ]
    },

    createInvidiousDashManifest: async function () {
      let url = `${this.currentInvidiousInstanceUrl}/api/manifest/dash/id/${this.videoId}`

      // If we are in Electron,
      // we can use YouTube.js' DASH manifest generator to generate the manifest.
      // Using YouTube.js' gives us support for multiple audio tracks (currently not supported by Invidious)
      if (process.env.SUPPORTS_LOCAL_API) {
        // Invidious' API response doesn't include the height and width (and fps and qualityLabel for AV1) of video streams
        // so we need to extract them from Invidious' manifest
        const response = await invidiousFetch(url)
        const originalText = await response.text()

        const parsedManifest = new DOMParser().parseFromString(originalText, 'application/xml')

        /** @type {import('youtubei.js').Misc.Format[]} */
        const formats = []

        /** @type {import('youtubei.js').Misc.Format[]} */
        const audioFormats = []

        let hasMultipleAudioTracks = false

        for (const format of this.adaptiveFormats) {
          if (format.type.startsWith('video/')) {
            const representation = parsedManifest.querySelector(`Representation[id="${format.itag}"][bandwidth="${format.bitrate}"]`)

            format.height = parseInt(representation.getAttribute('height'))
            format.width = parseInt(representation.getAttribute('width'))
            format.fps = parseInt(representation.getAttribute('frameRate'))

            // the quality label is missing for AV1 formats
            if (!format.qualityLabel) {
              format.qualityLabel = format.width > format.height ? `${format.height}p` : `${format.width}p`
            }
          }

          const localFormat = convertInvidiousToLocalFormat(format)

          if (localFormat.has_audio) {
            audioFormats.push(localFormat)

            if (localFormat.is_dubbed || localFormat.is_descriptive) {
              hasMultipleAudioTracks = true
            }
          }

          formats.push(localFormat)
        }

        if (hasMultipleAudioTracks) {
          // match YouTube's local API response with English
          const languageNames = new Intl.DisplayNames('en-US', { type: 'language' })
          for (const format of audioFormats) {
            this.generateAudioTrackFieldInvidious(format, languageNames)
          }

          this.audioTracks = this.createAudioTracksFromLocalFormats(audioFormats)
        }

        const manifest = await generateInvidiousDashManifestLocally(formats)

        url = `data:application/dash+xml;charset=UTF-8,${encodeURIComponent(manifest)}`
      } else if (this.proxyVideos) {
        url += '?local=true'
      }

      return [
        {
          url: url,
          type: 'application/dash+xml',
          label: 'Dash',
          qualityLabel: 'Auto'
        }
      ]
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

      return filterInvidiousFormats(result.adaptiveFormats, this.allowDashAv1Formats)
        .map((format) => {
          format.bitrate = parseInt(format.bitrate)
          if (typeof format.resolution === 'string') {
            format.height = parseInt(format.resolution.replace('p', ''))
          }
          return format
        })
    },

    createLocalStoryboardUrls: function (storyboardInfo) {
      const results = buildVTTFileLocally(storyboardInfo, this.videoLengthSeconds)

      // after the player migration, switch to using a data URI, as those don't need to be revoked

      const blob = new Blob([results], { type: 'text/vtt;charset=UTF-8' })

      this.videoStoryboardSrc = URL.createObjectURL(blob)
    },

    tryAddingTranslatedLocaleCaption: function (captionTracks, locale, baseUrl) {
      const enCaptionIdx = captionTracks.findIndex(track =>
        track.language_code === 'en' && track.kind !== 'asr'
      )

      const enCaptionExists = enCaptionIdx !== -1
      const asrEnabled = captionTracks.some(track => track.kind === 'asr')

      if (enCaptionExists || asrEnabled) {
        let label
        let url

        if (this.$te('Video.translated from English') && this.$t('Video.translated from English') !== '') {
          label = `${this.$t('Locale Name')} (${this.$t('Video.translated from English')})`
        } else {
          label = `${this.$t('Locale Name')} (translated from English)`
        }

        const indexTranslated = captionTracks.findIndex((item) => {
          return item.label === label
        })
        if (indexTranslated !== -1) {
          return
        }

        if (enCaptionExists) {
          url = new URL(captionTracks[enCaptionIdx].url)
        } else {
          url = new URL(baseUrl)
          url.searchParams.set('lang', 'en')
          url.searchParams.set('kind', 'asr')
        }

        url.searchParams.set('tlang', locale)
        captionTracks.unshift({
          url: url.toString(),
          label,
          language_code: locale,
          is_autotranslated: true
        })
      }
    },

    createCaptionPromiseList: function (captionTracks) {
      return captionTracks.map(caption => new Promise((resolve, reject) => {
        caption.type = 'text/vtt'
        caption.charset = 'charset=utf-8'
        caption.dataSource = 'local'

        const url = new URL(caption.url)
        url.searchParams.set('fmt', 'vtt')

        fetch(url)
          .then((response) => response.text())
          .then((text) => {
            // The character '#' needs to be percent-encoded in a (data) URI
            // because it signals an identifier, which means anything after it
            // is automatically removed when the URI is used as a source
            let vtt = text.replaceAll('#', '%23')

            // A lot of videos have messed up caption positions that need to be removed
            // This can be either because this format isn't really used by YouTube
            // or because it's expected for the player to be able to somehow
            // wrap the captions so that they won't step outside its boundaries
            //
            // Auto-generated captions are also all aligned to the start
            // so those instances must also be removed
            // In addition, all aligns seem to be fixed to "start" when they do pop up in normal captions
            // If it's prominent enough that people start to notice, it can be removed then
            if (caption.kind === 'asr') {
              vtt = vtt.replaceAll(/ align:start| position:\d{1,3}%/g, '')
            } else {
              vtt = vtt.replaceAll(/ position:\d{1,3}%/g, '')
            }

            caption.url = `data:${caption.type};${caption.charset},${vtt}`
            resolve(caption)
          })
          .catch((error) => {
            console.error(error)
            reject(error)
          })
      }))
    },

    pausePlayer: function () {
      const player = this.$refs.videoPlayer.player
      if (player && !player.paused()) {
        player.pause()
      }
    },

    getWatchedProgress: function () {
      return this.$refs.videoPlayer && this.$refs.videoPlayer.player ? this.$refs.videoPlayer.player.currentTime() : 0
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

    getPlaylistPauseOnCurrent: function () {
      return this.$refs.watchVideoPlaylist ? this.$refs.watchVideoPlaylist.pauseOnCurrentVideo : false
    },

    disablePlaylistPauseOnCurrent: function () {
      if (this.$refs.watchVideoPlaylist) {
        this.$refs.watchVideoPlaylist.pauseOnCurrentVideo = false
      }
    },

    updateTitle: function () {
      document.title = `${this.videoTitle} - ${packageDetails.productName}`
    },

    isHiddenVideo: function (forbiddenTitles, channelsHidden, video) {
      return channelsHidden.some(ch => ch.name === video.authorId) ||
        channelsHidden.some(ch => ch.name === video.author) ||
        forbiddenTitles.some((text) => video.title?.toLowerCase().includes(text.toLowerCase()))
    },

    updateLocalPlaylistLastPlayedAtSometimes() {
      if (this.selectedUserPlaylist == null) { return }

      const playlist = this.selectedUserPlaylist
      this.updatePlaylistLastPlayedAt({ _id: playlist._id })
    },

    ...mapActions([
      'updateHistory',
      'updateWatchProgress',
      'updateLastViewedPlaylist',
      'updatePlaylistLastPlayedAt',
      'updateSubscriptionDetails',
    ])
  }
})
