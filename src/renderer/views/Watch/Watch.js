import Vue from 'vue'
import { mapActions } from 'vuex'
import $ from 'jquery'
import fs from 'fs'
import ytDashGen from 'yt-dash-manifest-generator'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtVideoPlayer from '../../components/ft-video-player/ft-video-player.vue'
import WatchVideoInfo from '../../components/watch-video-info/watch-video-info.vue'
import WatchVideoDescription from '../../components/watch-video-description/watch-video-description.vue'
import WatchVideoComments from '../../components/watch-video-comments/watch-video-comments.vue'
import WatchVideoLiveChat from '../../components/watch-video-live-chat/watch-video-live-chat.vue'
import WatchVideoPlaylist from '../../components/watch-video-playlist/watch-video-playlist.vue'
import WatchVideoRecommendations from '../../components/watch-video-recommendations/watch-video-recommendations.vue'
import FtAgeRestricted from '../../components/ft-age-restricted/ft-age-restricted.vue'
import i18n from '../../i18n/index'

export default Vue.extend({
  name: 'Watch',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-element-list': FtElementList,
    'ft-video-player': FtVideoPlayer,
    'watch-video-info': WatchVideoInfo,
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
      isLoading: false,
      firstLoad: true,
      useTheatreMode: false,
      showDashPlayer: true,
      showLegacyPlayer: false,
      showYouTubeNoCookieEmbed: false,
      hidePlayer: false,
      isFamilyFriendly: false,
      isLive: false,
      isLiveContent: false,
      isUpcoming: false,
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
      channelName: '',
      channelThumbnail: '',
      channelId: '',
      channelSubscriptionCountText: '',
      videoPublished: 0,
      videoStoryboardSrc: '',
      audioUrl: '',
      dashSrc: [],
      activeSourceList: [],
      videoSourceList: [],
      audioSourceList: [],
      adaptiveFormats: [],
      captionHybridList: [], // [] -> Promise[] -> string[] (URIs)
      recommendedVideos: [],
      downloadLinks: [],
      watchingPlaylist: false,
      playlistId: '',
      timestamp: null,
      playNextTimeout: null,
      playNextCountDownIntervalId: null,
      pictureInPictureButtonInverval: null,
      infoAreaSticky: true
    }
  },
  computed: {
    isDev: function () {
      return process.env.NODE_ENV === 'development'
    },
    historyCache: function () {
      return this.$store.getters.getHistoryCache
    },
    rememberHistory: function () {
      return this.$store.getters.getRememberHistory
    },
    removeVideoMetaFiles: function () {
      return this.$store.getters.getRemoveVideoMetaFiles
    },
    saveWatchedProgress: function () {
      return this.$store.getters.getSaveWatchedProgress
    },
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
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
    showFamilyFriendlyOnly: function() {
      return this.$store.getters.getShowFamilyFriendlyOnly
    },

    youtubeNoCookieEmbeddedFrame: function () {
      return `<iframe width='560' height='315' src='https://www.youtube-nocookie.com/embed/${this.videoId}?rel=0' frameborder='0' allow='autoplay; encrypted-media' allowfullscreen></iframe>`
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
      return i18n.locale.replace('_', '-')
    }
  },
  watch: {
    $route() {
      this.handleRouteChange(this.videoId)
      // react to route changes...
      this.videoId = this.$route.params.id

      this.firstLoad = true
      this.activeFormat = this.defaultVideoFormat
      this.videoStoryboardSrc = ''
      this.captionHybridList = []
      this.downloadLinks = []

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
    activeFormat: function (format) {
      clearInterval(this.pictureInPictureButtonInverval)

      // only hide/show the button once the player is available
      this.pictureInPictureButtonInverval = setInterval(() => {
        if (!this.hidePlayer) {
          const pipButton = document.querySelector('.vjs-picture-in-picture-control')
          if (pipButton === null) {
            return
          }
          if (format === 'audio') {
            pipButton.classList.add('vjs-hidden')
          } else {
            pipButton.classList.remove('vjs-hidden')
          }
          clearInterval(this.pictureInPictureButtonInverval)
        }
      }, 100)
    }
  },
  mounted: function () {
    this.videoId = this.$route.params.id
    this.activeFormat = this.defaultVideoFormat
    this.useTheatreMode = this.defaultTheatreMode

    this.checkIfPlaylist()
    this.checkIfTimestamp()

    if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
      this.getVideoInformationInvidious()
    } else {
      this.getVideoInformationLocal()
    }

    window.addEventListener('beforeunload', this.handleWatchProgress)
  },
  methods: {
    changeTimestamp: function (timestamp) {
      this.$refs.videoPlayer.player.currentTime(timestamp)
    },
    toggleTheatreMode: function () {
      this.useTheatreMode = !this.useTheatreMode
    },

    getVideoInformationLocal: function () {
      if (this.firstLoad) {
        this.isLoading = true
      }

      this.ytGetVideoInformation(this.videoId)
        .then(async result => {
          console.log(result)

          const playabilityStatus = result.player_response.playabilityStatus
          if (playabilityStatus.status === 'UNPLAYABLE') {
            const errorScreen = playabilityStatus.errorScreen.playerErrorMessageRenderer
            const reason = errorScreen.reason.simpleText
            let subReason
            let skipIndex
            errorScreen.subreason.runs.forEach((message, index) => {
              if (index !== skipIndex) {
                if (message.text.match(/<a.*>/)) {
                  skipIndex = index + 1
                } else if (!message.text.match(/<\/a>/)) {
                  if (typeof subReason === 'undefined') {
                    subReason = message.text
                  } else {
                    subReason = subReason + message.text
                  }
                }
              }
            })

            throw new Error(`${reason}: ${subReason}`)
          }
          try {
            // workaround for title localization
            this.videoTitle = result.response.contents.twoColumnWatchNextResults.results.results.contents[0].videoPrimaryInfoRenderer.title.runs.map(run => run.text).join('')
          } catch (err) {
            console.error('Failed to extract localised video title, falling back to the standard one.', err)
            // if the workaround for localization fails, this sets the title to the potentially non-localized value
            this.videoTitle = result.videoDetails.title
          }
          this.videoViewCount = parseInt(
            result.player_response.videoDetails.viewCount,
            10
          )
          if ('id' in result.videoDetails.author) {
            this.channelId = result.player_response.videoDetails.channelId
            this.channelName = result.videoDetails.author.name
            console.log(result)
            if (result.videoDetails.author.thumbnails.length > 0) {
              this.channelThumbnail = result.videoDetails.author.thumbnails[0].url
            }
          } else {
            this.channelId = result.player_response.videoDetails.channelId
            this.channelName = result.player_response.videoDetails.author
            this.channelThumbnail = result.player_response.embedPreview.thumbnailPreviewRenderer.videoDetails.embeddedPlayerOverlayVideoDetailsRenderer.channelThumbnail.thumbnails[0].url
          }
          this.updateSubscriptionDetails({
            channelThumbnailUrl: this.channelThumbnail,
            channelName: this.channelName,
            channelId: this.channelId
          })

          this.videoPublished = new Date(result.videoDetails.publishDate.replace('-', '/')).getTime()
          try {
            // workaround for description localization
            const descriptionRuns = result.response.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer.description?.runs

            if (!Array.isArray(descriptionRuns)) {
              // eslint-disable-next-line no-throw-literal
              throw ['not an array', descriptionRuns]
            }

            const fallbackDescription = result.player_response.videoDetails.shortDescription

            // YouTube truncates links in the localised description
            // so we need to fix them here, so that autolinker can do it's job properly later on
            this.videoDescription = descriptionRuns
              .map(run => this.processDescriptionPart(run, fallbackDescription))
              .join('')
          } catch (err) {
            console.error('Failed to extract localised video description, falling back to the standard one.', err)
            // if the workaround for localization fails, this sets the description to the potentially non-localized value
            this.videoDescription = result.player_response.videoDetails.shortDescription
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
              this.thumbnail = result.videoDetails.thumbnails[result.videoDetails.thumbnails.length - 1].url
              break
          }

          this.isFamilyFriendly = result.videoDetails.isFamilySafe
          this.recommendedVideos = result.related_videos.map((video) => {
            video.videoId = video.id
            video.authorId = video.author.id
            video.viewCount = video.view_count
            video.lengthSeconds = video.length_seconds
            video.author = video.author.name
            video.publishedText = video.published
            return video
          })
          if (this.hideVideoLikesAndDislikes) {
            this.videoLikeCount = null
            this.videoDislikeCount = null
          } else {
            this.videoLikeCount = isNaN(result.videoDetails.likes) ? 0 : result.videoDetails.likes
            this.videoDislikeCount = isNaN(result.videoDetails.dislikes) ? 0 : result.videoDetails.dislikes
          }
          this.isLive = result.player_response.videoDetails.isLive
          this.isLiveContent = result.player_response.videoDetails.isLiveContent
          this.isUpcoming = result.player_response.videoDetails.isUpcoming ? result.player_response.videoDetails.isUpcoming : false

          if (this.videoDislikeCount === null && !this.hideVideoLikesAndDislikes) {
            this.videoDislikeCount = 0
          }

          const subCount = result.videoDetails.author.subscriber_count

          if (typeof (subCount) !== 'undefined' && !this.hideChannelSubscriptions) {
            if (subCount >= 1000000) {
              this.channelSubscriptionCountText = `${subCount / 1000000}M`
            } else if (subCount >= 10000) {
              this.channelSubscriptionCountText = `${subCount / 1000}K`
            } else {
              this.channelSubscriptionCountText = Intl.NumberFormat(this.currentLocale).format(subCount)
            }
          }

          if ((this.isLive && this.isLiveContent) && !this.isUpcoming) {
            this.enableLegacyFormat()

            this.videoSourceList = result.formats.filter((format) => {
              if (typeof (format.mimeType) !== 'undefined') {
                return format.mimeType.includes('video/ts')
              }

              return format.itag === 300 || format.itag === 301
            }).map((format) => {
              let qualityLabel

              if (format.itag === 300) {
                qualityLabel = '720p'
              } else if (format.itag === 301) {
                qualityLabel = '1080p'
              } else {
                qualityLabel = format.qualityLabel
              }
              return {
                url: format.url,
                type: 'application/x-mpegURL',
                label: 'Dash',
                qualityLabel: qualityLabel
              }
            }).sort((a, b) => {
              const qualityA = parseInt(a.qualityLabel.replace('p', ''))
              const qualityB = parseInt(b.qualityLabel.replace('p', ''))
              return qualityA - qualityB
            }).reverse()

            if (this.videoSourceList.length === 0) {
              this.activeSourceList = result.player_response.streamingData.formats
            } else {
              this.activeSourceList = this.videoSourceList
            }
          } else if (this.isUpcoming) {
            const startTimestamp = result.videoDetails.liveBroadcastDetails.startTimestamp

            if (typeof startTimestamp !== 'undefined') {
              const upcomingTimestamp = new Date(result.videoDetails.liveBroadcastDetails.startTimestamp)
              this.upcomingTimestamp = upcomingTimestamp.toLocaleString()

              let upcomingTimeLeft = upcomingTimestamp - new Date()

              // Convert from ms to second to minute
              upcomingTimeLeft = (upcomingTimeLeft / 1000) / 60
              let timeUnitI18nPartialKey = 'Minute'

              // Youtube switches to showing time left in minutes at 120 minutes remaining
              if (upcomingTimeLeft > 120) {
                upcomingTimeLeft = upcomingTimeLeft / 60
                timeUnitI18nPartialKey = 'Hour'
              }

              if (timeUnitI18nPartialKey === 'Hour' && upcomingTimeLeft > 24) {
                upcomingTimeLeft = upcomingTimeLeft / 24
                timeUnitI18nPartialKey = 'Day'
              }

              // Value after decimal not to be displayed
              // e.g. > 2 days = display as `2 days`
              upcomingTimeLeft = Math.floor(upcomingTimeLeft)
              if (upcomingTimeLeft !== 1) {
                timeUnitI18nPartialKey = timeUnitI18nPartialKey + 's'
              }
              const timeUnitTranslated = this.$t(`Video.Published.${timeUnitI18nPartialKey}`).toLowerCase()

              // Displays when less than a minute remains
              // Looks better than `Premieres in x seconds`
              if (upcomingTimeLeft < 1) {
                this.upcomingTimeLeft = this.$t('Video.Published.Less than a minute').toLowerCase()
              } else {
                // TODO a I18n entry for time format might be needed here
                this.upcomingTimeLeft = `${upcomingTimeLeft} ${timeUnitTranslated}`
              }
            } else {
              this.upcomingTimestamp = null
              this.upcomingTimeLeft = null
            }
          } else {
            this.videoLengthSeconds = parseInt(result.videoDetails.lengthSeconds)
            if (result.player_response.streamingData !== undefined) {
              if (typeof (result.player_response.streamingData.formats) !== 'undefined') {
                this.videoSourceList = result.player_response.streamingData.formats.reverse()
              } else {
                this.videoSourceList = result.player_response.streamingData.adaptiveFormats.reverse()
              }
              this.adaptiveFormats = this.videoSourceList
              this.downloadLinks = result.formats.filter((format) => {
                return typeof format.mimeType !== 'undefined'
              }).map((format) => {
                const qualityLabel = format.qualityLabel || format.bitrate
                const itag = format.itag
                const fps = format.fps ? (format.fps + 'fps') : 'kbps'
                const type = format.mimeType.match(/.*;/)[0].replace(';', '')
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
              })

              const captionTracks =
                result.player_response.captions &&
                result.player_response.captions.playerCaptionsTracklistRenderer
                  .captionTracks

              if (typeof captionTracks !== 'undefined') {
                const locale = this.$i18n.locale
                if (locale !== null) {
                  const standardLocale = locale.replace('_', '-')
                  const noLocaleCaption = !captionTracks.some(track =>
                    track.languageCode === standardLocale && track.kind !== 'asr'
                  )

                  if (!standardLocale.startsWith('en') && noLocaleCaption) {
                    captionTracks.forEach((caption) => {
                      this.tryAddingTranslatedLocaleCaption(captionTracks, standardLocale, caption.baseUrl)
                    })
                  }
                }

                this.captionHybridList = this.createCaptionPromiseList(captionTracks)

                const captionLinks = captionTracks.map((caption) => {
                  const label = `${caption.name.simpleText} (${caption.languageCode}) - text/vtt`

                  return {
                    url: caption.baseUrl,
                    label: label
                  }
                })

                this.downloadLinks = this.downloadLinks.concat(captionLinks)
              }
            } else {
              // video might be region locked or something else. This leads to no formats being available
              this.showToast({
                message: this.$t('This video is unavailable because of missing formats. This can happen due to country unavailability.'),
                time: 7000
              })
              this.handleVideoEnded()
              return
            }

            if (typeof result.player_response.streamingData.adaptiveFormats !== 'undefined') {
              const adaptiveFormats = result.player_response.streamingData.adaptiveFormats
              this.adaptiveFormats = adaptiveFormats
              if (this.proxyVideos) {
                this.dashSrc = await this.createInvidiousDashManifest()
              } else {
                this.dashSrc = await this.createLocalDashManifest(adaptiveFormats)
              }

              this.audioSourceList = result.player_response.streamingData.adaptiveFormats.filter((format) => {
                return format.mimeType.includes('audio')
              }).sort((a, b) => {
                return a.bitrate - b.bitrate
              }).map((format, index) => {
                const label = (x) => {
                  switch (x) {
                    case 0:
                      return this.$t('Video.Audio.Low')
                    case 1:
                      return this.$t('Video.Audio.Medium')
                    case 2:
                      return this.$t('Video.Audio.High')
                    case 3:
                      return this.$t('Video.Audio.Best')
                    default:
                      return format.bitrate
                  }
                }
                return {
                  url: format.url,
                  type: format.mimeType,
                  label: 'Audio',
                  qualityLabel: label(index)
                }
              }).reverse()

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

            if (typeof result.player_response.storyboards !== 'undefined') {
              const templateUrl = result.player_response.storyboards.playerStoryboardSpecRenderer.spec
              this.createLocalStoryboardUrls(templateUrl)
            }
          }

          this.isLoading = false
          this.updateTitle()
        })
        .catch(err => {
          const errorMessage = this.$t('Local API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err}`,
            time: 10000,
            action: () => {
              this.copyToClipboard({ content: err })
            }
          })
          console.log(err)
          if (this.backendPreference === 'local' && this.backendFallback && !err.toString().includes('private')) {
            this.showToast({
              message: this.$t('Falling back to Invidious API')
            })
            this.getVideoInformationInvidious()
          } else {
            this.isLoading = false
          }
        })
    },

    getVideoInformationInvidious: function () {
      if (this.firstLoad) {
        this.isLoading = true
      }

      this.dashSrc = this.createInvidiousDashManifest()
      this.videoStoryboardSrc = `${this.currentInvidiousInstance}/api/v1/storyboards/${this.videoId}?height=90`

      this.invidiousGetVideoInformation(this.videoId)
        .then(result => {
          console.log(result)

          if (result.error) {
            throw new Error(result.error)
          }

          this.videoTitle = result.title
          this.videoViewCount = result.viewCount
          if (this.hideVideoLikesAndDislikes) {
            this.videoLikeCount = null
            this.videoDislikeCount = null
          } else {
            this.videoLikeCount = result.likeCount
            this.videoDislikeCount = result.dislikeCount
          }
          if (this.hideChannelSubscriptions) {
            this.channelSubscriptionCountText = ''
          } else {
            this.channelSubscriptionCountText = result.subCountText || 'FT-0'
          }
          this.channelId = result.authorId
          this.channelName = result.author
          const channelThumb = result.authorThumbnails[1]
          this.channelThumbnail = channelThumb ? channelThumb.url.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`) : ''
          this.updateSubscriptionDetails({
            channelThumbnailUrl: channelThumb?.url,
            channelName: result.author,
            channelId: result.authorId
          })

          this.videoPublished = result.published * 1000
          this.videoDescriptionHtml = result.descriptionHtml
          this.recommendedVideos = result.recommendedVideos
          this.adaptiveFormats = result.adaptiveFormats.map((format) => {
            format.bitrate = parseInt(format.bitrate)
            if (typeof format.resolution !== 'undefined') {
              format.height = parseInt(format.resolution.replace('p', ''))
            }
            return format
          })
          this.isLive = result.liveNow
          this.isFamilyFriendly = result.isFamilyFriendly
          this.captionHybridList = result.captions.map(caption => {
            caption.url = this.currentInvidiousInstance + caption.url
            caption.type = ''
            caption.dataSource = 'invidious'
            return caption
          })

          switch (this.thumbnailPreference) {
            case 'start':
              this.thumbnail = `${this.currentInvidiousInstance}/vi/${this.videoId}/maxres1.jpg`
              break
            case 'middle':
              this.thumbnail = `${this.currentInvidiousInstance}/vi/${this.videoId}/maxres2.jpg`
              break
            case 'end':
              this.thumbnail = `${this.currentInvidiousInstance}/vi/${this.videoId}/maxres3.jpg`
              break
            default:
              this.thumbnail = result.videoThumbnails[0].url
              break
          }

          if (this.isLive) {
            this.showLegacyPlayer = true
            this.showDashPlayer = false
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
              const type = format.type.match(/.*;/)[0].replace(';', '')
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
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err.responseText}`,
            time: 10000,
            action: () => {
              this.copyToClipboard({ content: err.responseText })
            }
          })
          console.log(err)
          if (this.backendPreference === 'invidious' && this.backendFallback) {
            this.showToast({
              message: this.$t('Falling back to Local API')
            })
            this.getVideoInformationLocal()
          } else {
            this.isLoading = false
          }
        })
    },

    processDescriptionPart(part, fallbackDescription) {
      const timestampRegex = /^([0-9]+:)?[0-9]+:[0-9]+$/

      if (typeof part.navigationEndpoint === 'undefined' || part.navigationEndpoint === null || part.text.startsWith('#')) {
        return part.text
      }

      if (part.navigationEndpoint.urlEndpoint) {
        const urlWithTracking = part.navigationEndpoint.urlEndpoint.url
        const url = new URL(urlWithTracking)

        if (url.hostname === 'www.youtube.com' && url.pathname === '/redirect' && url.searchParams.has('q')) {
          // remove utm tracking parameters
          const realURL = new URL(url.searchParams.get('q'))

          realURL.searchParams.delete('utm_source')
          realURL.searchParams.delete('utm_medium')
          realURL.searchParams.delete('utm_campaign')
          realURL.searchParams.delete('utm_term')
          realURL.searchParams.delete('utm_content')

          return realURL.toString()
        } else if (fallbackDescription.includes(urlWithTracking)) {
          // this is probably a special YouTube URL like http://www.youtube.com/approachingnirvana
          // only use it if it exists in the fallback description
          // otherwise assume YouTube has changed it's tracking URLs and throw an error
          return urlWithTracking
        }

        // eslint-disable-next-line no-throw-literal
        throw `Failed to extract real URL from tracking URL: ${urlWithTracking}`
      } else if (part.navigationEndpoint.watchEndpoint) {
        if (timestampRegex.test(part.text)) {
          return part.text
        }
        const watchEndpoint = part.navigationEndpoint.watchEndpoint

        let videoURL = `https://www.youtube.com/watch?v=${watchEndpoint.videoId}`
        if (watchEndpoint.startTimeSeconds !== 0) {
          videoURL += `&t=${watchEndpoint.startTimeSeconds}s`
        }
        return videoURL
      } else {
        // Some YouTube URLs don't have the urlEndpoint so we handle them here

        const path = part.navigationEndpoint.commandMetadata.webCommandMetadata.url
        return `https://www.youtube.com${path}`
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
        timeWatched: new Date().getTime(),
        isLive: false,
        paid: false,
        type: 'video'
      }

      this.updateHistory(videoData)
    },

    handleWatchProgress: function () {
      if (this.rememberHistory && !this.isUpcoming && !this.isLoading && !this.isLive) {
        const player = this.$refs.videoPlayer.player

        if (player !== null && this.saveWatchedProgress) {
          const currentTime = this.getWatchedProgress()
          const payload = {
            videoId: this.videoId,
            watchProgress: currentTime
          }
          this.updateWatchProgress(payload)
        }
      }
    },

    checkIfWatched: function () {
      const historyIndex = this.historyCache.findIndex((video) => {
        return video.videoId === this.videoId
      })

      console.log(historyIndex)

      if (!this.isLive) {
        if (this.timestamp) {
          if (this.timestamp < 0) {
            this.$refs.videoPlayer.player.currentTime(0)
          } else if (this.timestamp > (this.videoLengthSeconds - 10)) {
            this.$refs.videoPlayer.player.currentTime(this.videoLengthSeconds - 10)
          } else {
            this.$refs.videoPlayer.player.currentTime(this.timestamp)
          }
        } else if (historyIndex !== -1) {
          const watchProgress = this.historyCache[historyIndex].watchProgress

          if (watchProgress < (this.videoLengthSeconds - 10)) {
            this.$refs.videoPlayer.player.currentTime(watchProgress)
          }
        }
      }

      if (this.rememberHistory) {
        if (this.timestamp) {
          this.addToHistory(this.timestamp)
        } else if (historyIndex !== -1) {
          this.addToHistory(this.historyCache[historyIndex].watchProgress)
        } else {
          this.addToHistory(0)
        }
      }
    },

    checkIfPlaylist: function () {
      if (typeof (this.$route.query) !== 'undefined') {
        this.playlistId = this.$route.query.playlistId

        if (typeof (this.playlistId) !== 'undefined') {
          this.watchingPlaylist = true
        } else {
          this.watchingPlaylist = false
        }
      } else {
        this.watchingPlaylist = false
      }
    },

    checkIfTimestamp: function () {
      if (typeof (this.$route.query) !== 'undefined') {
        try {
          this.timestamp = parseInt(this.$route.query.timestamp)
        } catch {
          this.timestamp = null
        }
      }
    },

    getLegacyFormats: function () {
      this.ytGetVideoInformation(this.videoId)
        .then(result => {
          this.videoSourceList = result.player_response.streamingData.formats
        })
        .catch(err => {
          const errorMessage = this.$t('Local API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err}`,
            time: 10000,
            action: () => {
              this.copyToClipboard({ content: err })
            }
          })
          console.log(err)
          if (!process.env.IS_ELECTRON || (this.backendPreference === 'local' && this.backendFallback)) {
            this.showToast({
              message: this.$t('Falling back to Invidious API')
            })
            this.getVideoInformationInvidious()
          }
        })
    },

    enableDashFormat: function () {
      if (this.activeFormat === 'dash' || this.isLive) {
        return
      }

      if (this.dashSrc === null) {
        this.showToast({
          message: this.$t('Change Format.Dash formats are not available for this video')
        })
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
        this.showToast({
          message: this.$t('Change Format.Audio formats are not available for this video')
        })
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

      const nextVideoInterval = this.defaultInterval
      this.playNextTimeout = setTimeout(() => {
        const player = this.$refs.videoPlayer.player
        if (player !== null && player.paused()) {
          if (this.watchingPlaylist) {
            this.$refs.watchVideoPlaylist.playNextVideo()
          } else {
            const nextVideoId = this.recommendedVideos[0].videoId
            this.$router.push({
              path: `/watch/${nextVideoId}`
            })
            this.showToast({
              message: this.$t('Playing Next Video')
            })
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

        this.showToast({
          message: this.$tc('Playing Next Video Interval', countDownTimeLeftInSecond, { nextVideoInterval: countDownTimeLeftInSecond }),
          // To avoid message flashing
          // `time` is manually tested to be 700
          time: 700,
          action: () => {
            clearTimeout(this.playNextTimeout)
            clearInterval(this.playNextCountDownIntervalId)
            this.showToast({
              message: this.$t('Canceled next video autoplay')
            })
          }
        })

        // At least this var should be updated AFTER showing the message
        countDownTimeLeftInSecond = countDownTimeLeftInSecond - 1
      }
      // Execute once before scheduling it
      showCountDownMessage()
      this.playNextCountDownIntervalId = setInterval(showCountDownMessage, 1000)
    },

    handleRouteChange: async function (videoId) {
      // if the user navigates to another video, the ipc call for the userdata path
      // takes long enough for the video id to have already changed to the new one
      // receiving it as an arg instead of accessing it ourselves means we always have the right one

      clearTimeout(this.playNextTimeout)
      clearInterval(this.playNextCountDownIntervalId)

      this.handleWatchProgress()

      if (!this.isUpcoming && !this.isLoading) {
        const player = this.$refs.videoPlayer.player

        if (player !== null && !player.paused() && player.isInPictureInPicture()) {
          setTimeout(() => {
            player.play()
            player.on('leavepictureinpicture', (event) => {
              const watchTime = player.currentTime()
              if (this.$route.fullPath.includes('/watch')) {
                const routeId = this.$route.params.id
                if (routeId === videoId) {
                  const activePlayer = $('.ftVideoPlayer video').get(0)
                  activePlayer.currentTime = watchTime
                }
              }

              player.pause()
              player.dispose()
            })
          }, 200)
        }
      }

      if (this.removeVideoMetaFiles) {
        const userData = await this.getUserDataPath()
        if (this.isDev) {
          const dashFileLocation = `static/dashFiles/${videoId}.xml`
          const vttFileLocation = `static/storyboards/${videoId}.vtt`
          // only delete the file it actually exists
          if (fs.existsSync(dashFileLocation)) {
            fs.rmSync(dashFileLocation)
          }
          if (fs.existsSync(vttFileLocation)) {
            fs.rmSync(vttFileLocation)
          }
        } else {
          const dashFileLocation = `${userData}/dashFiles/${videoId}.xml`
          const vttFileLocation = `${userData}/storyboards/${videoId}.vtt`

          if (fs.existsSync(dashFileLocation)) {
            fs.rmSync(dashFileLocation)
          }
          if (fs.existsSync(vttFileLocation)) {
            fs.rmSync(vttFileLocation)
          }
        }
      }
    },

    handleVideoError: function (error) {
      console.log(error)
      if (this.isLive) {
        return
      }

      if (error.code === 4) {
        if (this.activeFormat === 'dash') {
          console.log(
            'Unable to play dash formats.  Reverting to legacy formats...'
          )
          this.enableLegacyFormat()
        } else {
          this.enableDashFormat()
        }
      }
    },

    createLocalDashManifest: async function (formats) {
      const xmlData = ytDashGen.generate_dash_file_from_formats(formats, this.videoLengthSeconds)
      const userData = await this.getUserDataPath()
      let fileLocation
      let uriSchema
      if (this.isDev) {
        fileLocation = `static/dashFiles/${this.videoId}.xml`
        uriSchema = `dashFiles/${this.videoId}.xml`
        // if the location does not exist, writeFileSync will not create the directory, so we have to do that manually
        if (!fs.existsSync('static/dashFiles/')) {
          fs.mkdirSync('static/dashFiles/')
        }

        if (fs.existsSync(fileLocation)) {
          fs.rmSync(fileLocation)
        }
        fs.writeFileSync(fileLocation, xmlData)
      } else {
        fileLocation = `${userData}/dashFiles/${this.videoId}.xml`
        uriSchema = `file://${fileLocation}`

        if (!fs.existsSync(`${userData}/dashFiles/`)) {
          fs.mkdirSync(`${userData}/dashFiles/`)
        }

        fs.writeFileSync(fileLocation, xmlData)
      }

      return [
        {
          url: uriSchema,
          type: 'application/dash+xml',
          label: 'Dash',
          qualityLabel: 'Auto'
        }
      ]
    },

    createInvidiousDashManifest: function () {
      let url = `${this.currentInvidiousInstance}/api/manifest/dash/id/${this.videoId}`

      if (this.proxyVideos || !process.env.IS_ELECTRON) {
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

    createLocalStoryboardUrls: function (templateUrl) {
      const storyboards = templateUrl.split('|')
      const storyboardArray = []
      // Second storyboard: L1/M0 - Third storyboard: L2/M0 - Fourth: L3/M0

      const baseUrl = storyboards.shift()
      // remove the first link because it does not work
      storyboards.splice(0, 1)
      storyboards.forEach((storyboard, i) => {
        // Not sure why the _ variable is needed, but storyboards don't work unless we initialize it.

        /* eslint-disable-next-line */
        const [width, height, count, sWidth, sHeight, interval, _, sigh] = storyboard.split('#')
        storyboardArray.push({
          url: baseUrl.replace('$L', i + 1).replace('$N', 'M0').replace(/<\/?sub>/g, '') + '&sigh=' + sigh,
          width: Number(width), // Width of one sub image
          height: Number(height), // Height of one sub image
          sWidth: Number(sWidth), // Number of images vertically  (if full)
          sHeight: Number(sHeight), // Number of images horizontally (if full)
          count: Number(count), // Number of images total
          interval: Number(interval) // How long one image is used
        })
      })
      // TODO: MAKE A VARIABLE WHICH CAN CHOOSE BETWEEN STORYBOARD ARRAY ELEMENTS
      this.buildVTTFileLocally(storyboardArray[1]).then(async (results) => {
        const userData = await this.getUserDataPath()
        let fileLocation
        let uriSchema

        // Dev mode doesn't have access to the file:// schema, so we access
        // storyboards differently when run in dev
        if (this.isDev) {
          fileLocation = `static/storyboards/${this.videoId}.vtt`
          uriSchema = `storyboards/${this.videoId}.vtt`
          // if the location does not exist, writeFileSync will not create the directory, so we have to do that manually
          if (!fs.existsSync('static/storyboards/')) {
            fs.mkdirSync('static/storyboards/')
          }

          fs.rm(fileLocation, () => {
            fs.writeFileSync(fileLocation, results)
          })
        } else {
          if (!fs.existsSync(`${userData}/storyboards/`)) {
            fs.mkdirSync(`${userData}/storyboards/`)
          }
          fileLocation = `${userData}/storyboards/${this.videoId}.vtt`
          uriSchema = `file://${fileLocation}`

          fs.writeFileSync(fileLocation, results)
        }

        this.videoStoryboardSrc = uriSchema
      })
    },

    tryAddingTranslatedLocaleCaption: function (captionTracks, locale, baseUrl) {
      const enCaptionIdx = captionTracks.findIndex(track =>
        track.languageCode === 'en' && track.kind !== 'asr'
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
          return item.name.simpleText === label
        })
        if (indexTranslated !== -1) {
          return
        }

        if (enCaptionExists) {
          url = new URL(captionTracks[enCaptionIdx].baseUrl)
        } else {
          url = new URL(baseUrl)
          url.searchParams.set('lang', 'en')
          url.searchParams.set('kind', 'asr')
        }

        url.searchParams.set('tlang', locale)
        captionTracks.unshift({
          baseUrl: url.toString(),
          name: { simpleText: label },
          languageCode: locale
        })
      }
    },

    createCaptionPromiseList: function (captionTracks) {
      return captionTracks.map(caption => new Promise((resolve, reject) => {
        caption.type = 'text/vtt'
        caption.charset = 'charset=utf-8'
        caption.dataSource = 'local'

        const url = new URL(caption.baseUrl)
        url.searchParams.set('fmt', 'vtt')

        $.get(url.toString(), response => {
          // The character '#' needs to be percent-encoded in a (data) URI
          // because it signals an identifier, which means anything after it
          // is automatically removed when the URI is used as a source
          let vtt = response.replace(/#/g, '%23')

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
            vtt = vtt.replace(/ align:start| position:\d{1,3}%/g, '')
          } else {
            vtt = vtt.replace(/ position:\d{1,3}%/g, '')
          }

          caption.baseUrl = `data:${caption.type};${caption.charset},${vtt}`
          resolve(caption)
        }).fail((xhr, textStatus, error) => {
          console.log(xhr)
          console.log(textStatus)
          console.log(error)
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
          ? this.$refs.watchVideoPlaylist.playlistItems.length - this.$refs.watchVideoPlaylist.currentVideoIndex
          : this.$refs.watchVideoPlaylist.currentVideoIndex - 1
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
      document.title = `${this.videoTitle} - FreeTube`
    },

    ...mapActions([
      'showToast',
      'buildVTTFileLocally',
      'updateHistory',
      'updateWatchProgress',
      'getUserDataPath',
      'ytGetVideoInformation',
      'invidiousGetVideoInformation',
      'updateSubscriptionDetails',
      'copyToClipboard'
    ])
  }
})
