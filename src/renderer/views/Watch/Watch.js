import Vue from 'vue'
import { mapActions } from 'vuex'
import xml2vtt from 'yt-xml2vtt'
import $ from 'jquery'
import fs from 'fs'
import electron from 'electron'
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
    'watch-video-recommendations': WatchVideoRecommendations
  },
  data: function() {
    return {
      isLoading: false,
      firstLoad: true,
      useTheatreMode: false,
      showDashPlayer: true,
      showLegacyPlayer: false,
      showYouTubeNoCookieEmbed: false,
      hidePlayer: false,
      isLive: false,
      isUpcoming: false,
      upcomingTimestamp: null,
      activeFormat: 'legacy',
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
      captionSourceList: [],
      recommendedVideos: [],
      watchingPlaylist: false,
      playlistId: '',
      playNextTimeout: null
    }
  },
  computed: {
    isDev: function () {
      return process.env.NODE_ENV === 'development'
    },
    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },
    historyCache: function () {
      return this.$store.getters.getHistoryCache
    },
    rememberHistory: function () {
      return this.$store.getters.getRememberHistory
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
    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },
    proxyVideos: function () {
      return this.$store.getters.getProxyVideos
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

    thumbnail: function () {
      let baseUrl
      if (this.backendPreference === 'invidious') {
        baseUrl = this.invidiousInstance
      } else {
        baseUrl = 'https://i.ytimg.com'
      }

      switch (this.thumbnailPreference) {
        case 'start':
          return `${baseUrl}/vi/${this.videoId}/maxres1.jpg`
        case 'middle':
          return `${baseUrl}/vi/${this.videoId}/maxres2.jpg`
        case 'end':
          return `${baseUrl}/vi/${this.videoId}/maxres3.jpg`
        default:
          return `${baseUrl}/vi/${this.videoId}/maxresdefault.jpg`
      }
    },

    youtubeNoCookieEmbeddedFrame: function () {
      return `<iframe width='560' height='315' src='https://www.youtube-nocookie.com/embed/${this.videoId}?rel=0' frameborder='0' allow='autoplay; encrypted-media' allowfullscreen></iframe>`
    }
  },
  watch: {
    $route() {
      this.handleRouteChange()
      // react to route changes...
      this.videoId = this.$route.params.id

      this.firstLoad = true
      this.activeFormat = this.defaultVideoFormat
      this.videoStoryboardSrc = ''

      this.checkIfPlaylist()

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
    }
  },
  mounted: function () {
    this.videoId = this.$route.params.id
    this.activeFormat = this.defaultVideoFormat
    this.useTheatreMode = this.defaultTheatreMode

    this.checkIfPlaylist()

    if (!this.usingElectron) {
      this.getVideoInformationInvidious()
    } else {
      switch (this.backendPreference) {
        case 'local':
          this.getVideoInformationLocal()
          break
        case 'invidious':
          this.getVideoInformationInvidious()
          break
      }
    }
  },
  methods: {
    toggleTheatreMode: function() {
      this.useTheatreMode = !this.useTheatreMode
    },

    getVideoInformationLocal: function() {
      if (this.firstLoad) {
        this.isLoading = true
      }

      this.$store
        .dispatch('ytGetVideoInformation', this.videoId)
        .then(async result => {
          console.log(result)
          this.videoTitle = result.videoDetails.title
          this.videoViewCount = parseInt(
            result.player_response.videoDetails.viewCount,
            10
          )
          this.channelId = result.videoDetails.author.id
          this.channelName = result.videoDetails.author.name
          this.channelThumbnail = result.videoDetails.author.avatar
          this.videoPublished = new Date(result.videoDetails.publishDate.replace('-', '/')).getTime()
          this.videoDescription =
            result.player_response.videoDetails.shortDescription
          this.recommendedVideos = result.related_videos.map((video) => {
            video.videoId = video.id
            video.authorId = video.ucid
            video.viewCount = video.view_count
            video.lengthSeconds = video.length_seconds
            return video
          })
          this.videoLikeCount = result.videoDetails.likes
          this.videoDislikeCount = result.videoDetails.dislikes
          this.isLive = result.player_response.videoDetails.isLiveContent
          this.isUpcoming = result.player_response.videoDetails.isUpcoming ? result.player_response.videoDetails.isUpcoming : false

          if (!this.isLive && !this.isUpcoming) {
            const captionTracks =
              result.player_response.captions &&
              result.player_response.captions.playerCaptionsTracklistRenderer
                .captionTracks

            if (typeof captionTracks !== 'undefined') {
              await this.createCaptionUrls(captionTracks)
            }
          }

          if (this.videoDislikeCount === null) {
            this.videoDislikeCount = 0
          }

          const subCount = result.videoDetails.author.subscriber_count

          if (typeof (subCount) !== 'undefined') {
            if (subCount >= 1000000) {
              this.channelSubscriptionCountText = `${subCount / 1000000}M`
            } else if (subCount >= 10000) {
              this.channelSubscriptionCountText = `${subCount / 1000}K`
            } else {
              this.channelSubscriptionCountText = subCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
            }
          }

          if (this.isLive && !this.isUpcoming) {
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
            })

            if (this.videoSourceList.length === 0) {
              this.activeSourceList = result.player_response.streamingData.formats
            } else {
              this.activeSourceList = this.videoSourceList
            }
          } else if (this.isUpcoming) {
            const upcomingTimestamp = new Date(result.videoDetails.liveBroadcastDetails.startTimestamp)
            this.upcomingTimestamp = upcomingTimestamp.toLocaleString()
          } else {
            this.videoLengthSeconds = parseInt(result.videoDetails.lengthSeconds)
            this.videoSourceList = result.player_response.streamingData.formats

            if (typeof result.player_response.streamingData.adaptiveFormats !== 'undefined') {
              this.dashSrc = await this.createLocalDashManifest(result.player_response.streamingData.adaptiveFormats)

              this.audioSourceList = result.player_response.streamingData.adaptiveFormats.filter((format) => {
                return format.mimeType.includes('audio')
              }).map((format) => {
                return {
                  url: format.url,
                  type: format.mimeType,
                  label: 'Audio',
                  qualityLabel: format.bitrate
                }
              }).sort((a, b) => {
                return a.qualityLabel - b.qualityLabel
              })

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
        })
        .catch(err => {
          const errorMessage = this.$t('Local API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(err)
            }
          })
          console.log(err)
          if (!this.usingElectron || (this.backendPreference === 'local' && this.backendFallback && !err.includes('private'))) {
            this.showToast({
              message: this.$t('Falling back to Invidious API')
            })
            this.getVideoInformationInvidious()
          } else {
            this.isLoading = false
          }
        })
    },

    getVideoInformationInvidious: function() {
      if (this.firstLoad) {
        this.isLoading = true
      }

      this.dashSrc = this.createInvidiousDashManifest()
      this.videoStoryboardSrc = `${this.invidiousInstance}/api/v1/storyboards/${this.videoId}?height=90`

      this.$store
        .dispatch('invidiousGetVideoInformation', this.videoId)
        .then(result => {
          console.log(result)

          this.videoTitle = result.title
          this.videoViewCount = result.viewCount
          this.videoLikeCount = result.likeCount
          this.videoDislikeCount = result.dislikeCount
          this.channelSubscriptionCountText = result.subCountText || 'FT-0'
          this.channelId = result.authorId
          this.channelName = result.author
          this.channelThumbnail = result.authorThumbnails[1] ? result.authorThumbnails[1].url : ''
          this.videoPublished = result.published * 1000
          this.videoDescriptionHtml = result.descriptionHtml
          this.recommendedVideos = result.recommendedVideos
          this.isLive = result.liveNow
          this.captionSourceList = result.captions.map(caption => {
            caption.url = this.invidiousInstance + caption.url
            caption.type = ''
            caption.dataSource = 'invidious'
            return caption
          })

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

          this.isLoading = false
        })
        .catch(err => {
          const errorMessage = this.$t('Invidious API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(err)
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
            // TODO: Show toast with error message
          }
        })
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

    checkIfWatched: function () {
      const historyIndex = this.historyCache.findIndex((video) => {
        return video.videoId === this.videoId
      })

      console.log(historyIndex)

      if (historyIndex !== -1 && !this.isLive) {
        console.log(this.historyCache[historyIndex])
        const watchProgress = this.historyCache[historyIndex].watchProgress
        this.$refs.videoPlayer.player.currentTime(watchProgress)
      }

      if (this.rememberHistory && historyIndex !== -1) {
        this.addToHistory(this.historyCache[historyIndex].watchProgress)
      } else if (this.rememberHistory) {
        this.addToHistory(0)
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

    getLegacyFormats: function () {
      this.$store
        .dispatch('ytGetVideoInformation', this.videoId)
        .then(result => {
          this.videoSourceList = result.player_response.streamingData.formats
        })
        .catch(err => {
          const errorMessage = this.$t('Local API Error (Click to copy)')
          this.showToast({
            message: `${errorMessage}: ${err}`,
            time: 10000,
            action: () => {
              navigator.clipboard.writeText(err)
            }
          })
          console.log(err)
          if (!this.usingElectron || (this.backendPreference === 'local' && this.backendFallback)) {
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

      this.activeFormat = 'dash'
      this.hidePlayer = true

      setTimeout(() => {
        this.hidePlayer = false
      }, 100)
    },

    enableLegacyFormat: function () {
      if (this.activeFormat === 'legacy') {
        return
      }

      this.activeFormat = 'legacy'
      this.activeSourceList = this.videoSourceList
      this.hidePlayer = true

      setTimeout(() => {
        this.hidePlayer = false
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

      this.activeFormat = 'audio'
      this.activeSourceList = this.audioSourceList
      this.hidePlayer = true

      setTimeout(() => {
        this.hidePlayer = false
      }, 100)
    },

    handleVideoEnded: function () {
      if (this.watchingPlaylist) {
        this.playNextTimeout = setTimeout(() => {
          this.$refs.watchVideoPlaylist.playNextVideo()
        }, 5000)

        this.showToast({
          message: this.$t('Playing next video in 5 seconds.  Click to cancel'),
          time: 5500,
          action: () => {
            clearTimeout(this.playNextTimeout)
            this.showToast({
              message: this.$t('Canceled next video autoplay')
            })
          }
        })
      } else if (this.playNextVideo) {
        this.playNextTimeout = setTimeout(() => {
          const nextVideoId = this.recommendedVideos[0].videoId
          this.$router.push(
            {
              path: `/watch/${nextVideoId}`
            }
          )
          this.showToast({
            message: this.$t('Playing Next Video')
          })
        }, 5000)

        this.showToast({
          message: this.$t('Playing next video in 5 seconds.  Click to cancel'),
          time: 5500,
          action: () => {
            clearTimeout(this.playNextTimeout)
            this.showToast({
              message: this.$t('Canceled next video autoplay')
            })
          }
        })
      }
    },

    handleRouteChange: function () {
      clearTimeout(this.playNextTimeout)

      if (this.rememberHistory && !this.isLoading && !this.isLive) {
        const player = this.$refs.videoPlayer.player

        if (player !== null && this.saveWatchedProgress) {
          const currentTime = this.getWatchedProgress()
          const payload = {
            videoId: this.videoId,
            watchProgress: currentTime
          }

          console.log('update watch progress')
          this.updateWatchProgress(payload)
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

    createLocalDashManifest: function (formats) {
      const xmlData = ytDashGen.generate_dash_file_from_formats(formats, this.videoLengthSeconds)
      const userData = electron.remote.app.getPath('userData')
      let fileLocation
      let uriSchema
      if (this.isDev) {
        fileLocation = `dashFiles/${this.videoId}.xml`
        uriSchema = fileLocation
        // if the location does not exist, writeFileSync will not create the directory, so we have to do that manually
        if (!fs.existsSync('dashFiles/')) {
          fs.mkdirSync('dashFiles/')
        }
      } else {
        fileLocation = `${userData}/dashFiles/${this.videoId}.xml`
        uriSchema = `file://${fileLocation}`

        if (!fs.existsSync(`${userData}/dashFiles/`)) {
          fs.mkdirSync(`${userData}/dashFiles/`)
        }
      }
      fs.writeFileSync(fileLocation, xmlData)
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
      let url = `${this.invidiousInstance}/api/manifest/dash/id/${this.videoId}.mpd`

      if (this.proxyVideos || !this.usingElectron) {
        url = url + '?local=true'
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
      // TODO: MAKE A VARIABLE WHICH CAN CHOOSE BETWEEN STROYBOARD ARRAY ELEMENTS
      this.buildVTTFileLocally(storyboardArray[1]).then((results) => {
        const userData = electron.remote.app.getPath('userData')
        let fileLocation
        let uriSchema

        // Dev mode doesn't have access to the file:// schema, so we access
        // storyboards differently when run in dev
        if (this.isDev) {
          fileLocation = `storyboards/${this.videoId}.vtt`
          uriSchema = fileLocation
          // if the location does not exist, writeFileSync will not create the directory, so we have to do that manually
          if (!fs.existsSync('storyboards/')) {
            fs.mkdirSync('storyboards/')
          }
        } else {
          if (!fs.existsSync(`${userData}/storyboards/`)) {
            fs.mkdirSync(`${userData}/storyboards/`)
          }
          fileLocation = `${userData}/storyboards/${this.videoId}.vtt`
          uriSchema = `file://${fileLocation}`
        }
        fs.writeFileSync(fileLocation, results)

        this.videoStoryboardSrc = uriSchema
      })
    },

    createCaptionUrls: function (captionTracks) {
      this.captionSourceList = captionTracks.map(caption => {
        caption.type = 'text/vtt'
        caption.charset = 'charset=utf-8'
        caption.dataSource = 'local'

        $.get(caption.baseUrl, response => {
          xml2vtt
            .Parse(new XMLSerializer().serializeToString(response))
            .then(vtt => {
              caption.baseUrl = `data:${caption.type};${caption.charset},${vtt}`
            })
            .catch(err =>
              console.log(`Error while converting XML to VTT : ${err}`)
            )
        }).fail((xhr, textStatus, error) => {
          console.log(xhr)
          console.log(textStatus)
          console.log(error)
        })

        return caption
      })
    },

    getWatchedProgress: function () {
      return this.$refs.videoPlayer && this.$refs.videoPlayer.player ? this.$refs.videoPlayer.player.currentTime() : 0
    },

    getTimestamp: function () {
      return Math.floor(this.getWatchedProgress())
    },

    ...mapActions([
      'showToast',
      'buildVTTFileLocally',
      'updateHistory',
      'updateWatchProgress'
    ])
  },
  beforeRouteLeave: function (to, from, next) {
    this.handleRouteChange()
    next()
  }
})
