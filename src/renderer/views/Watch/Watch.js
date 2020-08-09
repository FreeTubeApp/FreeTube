import Vue from 'vue'
import { mapActions } from 'vuex'
import xml2vtt from 'yt-xml2vtt'
import $ from 'jquery'
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
      activeFormat: 'legacy',
      videoId: '',
      videoTitle: '',
      videoDescription: '',
      videoDescriptionHtml: '',
      videoViewCount: 0,
      videoLikeCount: 0,
      videoDislikeCount: 0,
      channelName: '',
      channelThumbnail: '',
      channelId: '',
      channelSubscriptionCountText: '',
      videoPublished: 0,
      videoStoryboardSrc: '',
      audioUrl: '',
      activeSourceList: [],
      videoSourceList: [],
      audioSourceList: [],
      captionSourceList: [],
      recommendedVideos: [],
      watchingPlaylist: false,
      playlistId: ''
    }
  },
  computed: {
    usingElectron: function () {
      return this.$store.getters.getUsingElectron
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
    },

    dashSrc: function () {
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
    }
  },
  watch: {
    $route() {
      // react to route changes...
      this.videoId = this.$route.params.id

      this.firstLoad = true
      this.activeFormat = this.defaultVideoFormat

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
    this.videoStoryboardSrc = `${this.invidiousInstance}/api/v1/storyboards/${this.videoId}?height=90`

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
        .then(result => {
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
          this.recommendedVideos = result.related_videos
          this.videoLikeCount = result.videoDetails.likes
          this.videoDislikeCount = result.videoDetails.dislikes
          this.isLive = result.player_response.videoDetails.isLiveContent

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

          if (this.isLive) {
            this.showLegacyPlayer = true
            this.showDashPlayer = false

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
          } else {
            this.videoSourceList = result.player_response.streamingData.formats

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
          }

          // The response provides a storyboard, however it returns a 403 error.
          // Uncomment this line if that ever changes.
          // this.videoStoryboardSrc = result.player_response.storyboards.playerStoryboardSpecRenderer.spec

          this.captionSourceList =
            result.player_response.captions &&
            result.player_response.captions.playerCaptionsTracklistRenderer
              .captionTracks

          if (typeof this.captionSourceList !== 'undefined') {
            this.captionSourceList = this.captionSourceList.map(caption => {
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
          if (!this.usingElectron || (this.backendPreference === 'local' && this.backendFallback)) {
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

      this.$store
        .dispatch('invidiousGetVideoInformation', this.videoId)
        .then(result => {
          console.log(result)

          this.videoTitle = result.title
          this.videoViewCount = result.viewCount
          this.videoLikeCount = result.likeCount
          this.videoDislikeCount = result.dislikeCount
          this.channelSubscriptionCountText = result.subCountText
          this.channelId = result.authorId
          this.channelName = result.author
          this.channelThumbnail = result.authorThumbnails[1].url
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

      this.activeFormat = 'audio'
      this.activeSourceList = this.audioSourceList
      this.hidePlayer = true

      setTimeout(() => {
        this.hidePlayer = false
      }, 100)
    },

    handleVideoEnded: function () {
      if (this.watchingPlaylist) {
        const timeout = setTimeout(() => {
          this.$refs.watchVideoPlaylist.playNextVideo()
        }, 5000)

        this.showToast({
          message: this.$t('Playing next video in 5 seconds.  Click to cancel'),
          time: 5500,
          action: () => {
            clearTimeout(timeout)
            this.showToast({
              message: this.$t('Canceled next video autoplay')
            })
          }
        })
      }
    },

    handleVideoError: function(error) {
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

    ...mapActions([
      'showToast'
    ])
  }
})
