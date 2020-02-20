import Vue from 'vue'
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
    'watch-video-recommendations': WatchVideoRecommendations
  },
  data: function () {
    return {
      isLoading: false,
      firstLoad: true,
      useTheatreMode: true,
      showDashPlayer: true,
      showLegacyPlayer: false,
      showYouTubeNoCookieEmbed: false,
      proxyVideos: false,
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
      recommendedVideos: []
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    invidiousInstance: function () {
      return this.$store.getters.getInvidiousInstance
    },

    videoFormatPreference: function () {
      return this.$store.getters.getVideoFormatPreference
    },

    videoDashUrl: function () {
      return `${this.invidiousInstance}/api/manifest/dash/id/${this.videoId}.mpd`
    },

    youtubeNoCookieEmbeddedFrame: function () {
      return `<iframe width='560' height='315' src='https://www.youtube-nocookie.com/embed/${this.videoId}?rel=0' frameborder='0' allow='autoplay; encrypted-media' allowfullscreen></iframe>`
    },

    dashSrc: function () {
      return [{
        url: `${this.invidiousInstance}/api/manifest/dash/${this.videoId}.mpd`,
        type: 'application/dash+xml',
        label: 'Dash'
      }]
    }
  },
  watch: {
    $route () {
      // react to route changes...
      this.videoId = this.$route.params.id

      this.firstLoad = true

      switch (this.backendPreference) {
        case 'local':
          this.getVideoInformationLocal(this.videoId)
          break
        case 'invidious':
          this.getVideoInformationInvidious(this.videoId)
          break
      }
    }
  },
  mounted: function () {
    this.videoId = this.$route.params.id
    this.videoStoryboardSrc = `${this.invidiousInstance}/api/v1/storyboards/${this.videoId}?height=90`

    this.activeFormat = this.videoFormatPreference

    if (this.proxyVideos) {
      this.dashSrc = this.dashSrc + '?local=true'
    }

    switch (this.backendPreference) {
      case 'local':
        this.getVideoInformationLocal(this.videoId)
        break
      case 'invidious':
        this.getVideoInformationInvidious(this.videoId)
        break
    }
  },
  methods: {
    toggleTheatreMode: function () {
      this.useTheatreMode = !this.useTheatreMode
    },

    getVideoInformationLocal: function () {
      if (this.firstLoad) {
        this.isLoading = true
      }

      this.$store.dispatch('ytGetVideoInformation', this.videoId).then((result) => {
        console.log(result)

        this.videoTitle = result.title
        this.videoViewCount = parseInt(result.player_response.videoDetails.viewCount)
        this.channelId = result.author.id
        this.channelName = result.author.name
        this.channelThumbnail = result.author.avatar
        this.videoPublished = result.published
        this.videoDescription = result.player_response.videoDetails.shortDescription
        this.recommendedVideos = result.related_videos
        this.videoSourceList = result.player_response.streamingData.formats

        // The response provides a storyboard, however it returns a 403 error.
        // Uncomment this line if that ever changes.
        // this.videoStoryboardSrc = result.player_response.storyboards.playerStoryboardSpecRenderer.spec

        this.captionSourceList = result.player_response.captions.playerCaptionsTracklistRenderer.captionTracks

        if (typeof (this.captionSourceList) !== 'undefined') {
          this.captionSourceList = this.captionSourceList.map((caption) => {
            caption.baseUrl = `${this.invidiousInstance}/api/v1/captions/${this.videoId}?label=${encodeURI(caption.name.simpleText)}`

            return caption
          })
        }

        // TODO: The response returns the captions of the video, however they're returned
        // in XML / TTML.  I haven't found a way to properly convert this for use.
        // There may be another URL that we can use to grab an appropriate format as well.
        // Video.js requires that the captions are returned in .vtt format.  The below code
        // Converts it to .srt which may work, but I can't get the player to accept the data.

        // this.captionSourceList = this.captionSourceList.map((caption) => {
        //   caption.type = 'application/ttml+xml'
        //   caption.dataSource = 'local'
        //
        //   $.get(caption.baseUrl, (response) => {
        //     console.log('response')
        //     console.log(response)
        //     console.log()
        //     xml2srt.Parse(new XMLSerializer().serializeToString(response))
        //       .then(srt => {
        //         caption.track = srt
        //       }).catch(err => console.log(`Error while converting XML to SRT : ${err}`))
        //   }).fail((xhr, textStatus, error) => {
        //     console.log(xhr)
        //     console.log(textStatus)
        //     console.log(error)
        //   })
        //
        //   return caption
        // })

        this.isLoading = false
      }).catch((err) => {
        console.log(err)
        if (this.backendPreference === 'local' && this.backendFallback) {
          console.log('Error getting data with local backend, falling back to Invidious')
          this.getVideoInformationInvidious()
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    getVideoInformationInvidious: function () {
      if (this.firstLoad) {
        this.isLoading = true
      }

      this.$store.dispatch('invidiousGetVideoInformation', this.videoId).then((result) => {
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
        this.videoSourceList = result.formatStreams.reverse()
        this.captionSourceList = result.captions.map((caption) => {
          caption.url = this.invidiousInstance + caption.url
          caption.type = ''
          caption.dataSource = 'invidious'
          return caption
        })

        this.isLoading = false
      }).catch((err) => {
        console.log(err)
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          console.log('Error getting data with Invidious, falling back to local backend')
          this.getVideoInformationLocal()
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    enableDashFormat: function () {
      if (this.activeFormat === 'dash') {
        return
      }

      this.activeFormat = 'dash'
      this.hidePlayer = true

      setTimeout(() => { this.hidePlayer = false }, 100)
    },

    enableLegacyFormat: function () {
      if (this.activeFormat === 'legacy') {
        return
      }

      this.activeFormat = 'legacy'
      this.hidePlayer = true

      setTimeout(() => {
        this.hidePlayer = false
      }, 100)
    }
  }
})
