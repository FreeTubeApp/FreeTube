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
      showDashPlayer: true,
      showLegacyPlayer: false,
      showYouTubeNoCookieEmbed: false,
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
      videoUrl360p: '',
      videoUrl720p: '',
      audioUrl: '',
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

    videoDashUrl: function () {
      return `${this.invidiousInstance}/api/manifest/dash/id/${this.videoId}.mpd`
    },

    youtubeNoCookieEmbeddedFrame: function () {
      return `<iframe width='560' height='315' src='https://www.youtube-nocookie.com/embed/${this.videoId}?rel=0' frameborder='0' allow='autoplay; encrypted-media' allowfullscreen></iframe>`
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

        this.videoUrl720p = result.player_response.streamingData.formats[1].url

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

        this.videoUrl720p = result.formatStreams[0].url

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
    }
  }
})
