import Vue from 'vue'
import xml2vtt from 'yt-xml2vtt'
import $ from 'jquery'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'
import FtVideoPlayer from '../../components/ft-video-player/ft-video-player.vue'
import WatchVideoInfo from '../../components/watch-video-info/watch-video-info.vue'
import WatchVideoDescription from '../../components/watch-video-description/watch-video-description.vue'
import WatchVideoComments from '../../components/watch-video-comments/watch-video-comments.vue'
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
    'watch-video-recommendations': WatchVideoRecommendations,
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
      videoSourceList: [],
      captionSourceList: [],
      recommendedVideos: [],
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
        },
      ]
    },
  },
  watch: {
    $route() {
      // react to route changes...
      this.videoId = this.$route.params.id

      this.firstLoad = true

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
  },
  mounted: function() {
    this.videoId = this.$route.params.id
    this.videoStoryboardSrc = `${this.invidiousInstance}/api/v1/storyboards/${this.videoId}?height=90`

    this.activeFormat = this.defaultVideoFormat
    this.useTheatreMode = this.defaultTheatreMode

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
          this.videoTitle = result.title
          this.videoViewCount = parseInt(
            result.player_response.videoDetails.viewCount,
            10
          )
          this.channelId = result.author.id
          this.channelName = result.author.name
          this.channelThumbnail = result.author.avatar
          this.videoPublished = result.published
          this.videoDescription =
            result.player_response.videoDetails.shortDescription
          this.recommendedVideos = result.related_videos
          this.videoSourceList = result.player_response.streamingData.formats
          this.videoLikeCount = result.likes
          this.videoDislikeCount = result.dislikes

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
          console.log('Error grabbing video data through local API')
          console.log(err)
          if (!this.usingElectron || (this.backendPreference === 'local' && this.backendFallback)) {
            console.log(
              'Error getting data with local backend, falling back to Invidious'
            )
            this.getVideoInformationInvidious()
          } else {
            this.isLoading = false
            // TODO: Show toast with error message
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
          this.captionSourceList = result.captions.map(caption => {
            caption.url = this.invidiousInstance + caption.url
            caption.type = ''
            caption.dataSource = 'invidious'
            return caption
          })

          if (this.forceLocalBackendForLegacy) {
            this.getLegacyFormats()
          } else {
            this.videoSourceList = result.formatStreams.reverse()
          }

          this.isLoading = false
        })
        .catch(err => {
          console.log(err)
          if (this.backendPreference === 'invidious' && this.backendFallback) {
            console.log(
              'Error getting data with Invidious, falling back to local backend'
            )
            this.getVideoInformationLocal()
          } else {
            this.isLoading = false
            // TODO: Show toast with error message
          }
        })
    },

    getLegacyFormats: function () {
      this.$store
        .dispatch('ytGetVideoInformation', this.videoId)
        .then(result => {
          this.videoSourceList = result.player_response.streamingData.formats
        })
    },

    enableDashFormat: function () {
      if (this.activeFormat === 'dash') {
        return
      }

      this.activeFormat = 'dash'
      this.hidePlayer = true

      setTimeout(() => {
        this.hidePlayer = false
      }, 100)
    },

    enableLegacyFormat: function() {
      if (this.activeFormat === 'legacy') {
        return
      }

      this.activeFormat = 'legacy'
      this.hidePlayer = true

      setTimeout(() => {
        this.hidePlayer = false
      }, 100)
    },

    handleVideoError: function(error) {
      console.log(error)
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
  },
})
