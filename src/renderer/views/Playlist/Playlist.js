import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import PlaylistInfo from '../../components/playlist-info/playlist-info.vue'
import FtListVideoLazy from '../../components/ft-list-video-lazy/ft-list-video-lazy.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import {
  getLocalPlaylist,
  getLocalPlaylistContinuation,
  parseLocalPlaylistVideo,
} from '../../helpers/api/local'
import { extractNumberFromString } from '../../helpers/utils'
import { invidiousGetPlaylistInfo, youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { getPipedPlaylist, getPipedPlaylistMore, pipedImageToYouTube } from '../../helpers/api/piped'
export default defineComponent({
  name: 'Playlist',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'playlist-info': PlaylistInfo,
    'ft-list-video-lazy': FtListVideoLazy,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton
  },
  beforeRouteLeave(to, from, next) {
    if (!this.isLoading && to.path.startsWith('/watch') && to.query.playlistId === this.playlistId) {
      this.setCachedPlaylist({
        id: this.playlistId,
        title: this.infoData.title,
        channelName: this.infoData.channelName,
        channelId: this.infoData.channelId,
        items: this.playlistItems,
        continuationData: this.continuationData
      })
    }
    next()
  },
  data: function () {
    return {
      isLoading: false,
      playlistId: null,
      infoData: {},
      playlistItems: [],
      continuationData: null,
      isLoadingMore: false
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    fallbackPreference: function () {
      return this.$store.getters.getFallbackPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    currentInvidiousInstance: function () {
      return this.$store.getters.getCurrentInvidiousInstance
    },
    currentLocale: function () {
      return this.$i18n.locale.replace('_', '-')
    }
  },
  watch: {
    $route () {
      // react to route changes...
      this.getPlaylist()
    }
  },
  mounted: function () {
    this.getPlaylist()
  },
  methods: {
    getPlaylist: function () {
      this.playlistId = this.$route.params.id

      switch (this.backendPreference) {
        case 'local':
          this.getPlaylistLocal()
          break
        case 'invidious':
          this.getPlaylistInvidious()
          break
        case 'piped':
          this.getPlaylistPiped()
          break
      }
    },
    getPlaylistLocal: function () {
      this.isLoading = true

      getLocalPlaylist(this.playlistId).then((result) => {
        let channelName

        if (result.info.author) {
          channelName = result.info.author.name
        } else {
          const subtitle = result.info.subtitle.toString()

          const index = subtitle.lastIndexOf('•')
          channelName = subtitle.substring(0, index).trim()
        }

        this.infoData = {
          id: this.playlistId,
          title: result.info.title,
          description: result.info.description ?? '',
          firstVideoId: result.items[0].id,
          playlistThumbnail: result.info.thumbnails[0].url,
          viewCount: extractNumberFromString(result.info.views),
          videoCount: extractNumberFromString(result.info.total_items),
          lastUpdated: result.info.last_updated ?? '',
          channelName,
          channelThumbnail: result.info.author?.best_thumbnail?.url ?? '',
          channelId: result.info.author?.id,
          infoSource: 'local'
        }

        this.updateSubscriptionDetails({
          channelThumbnailUrl: this.infoData.channelThumbnail,
          channelName: this.infoData.channelName,
          channelId: this.infoData.channelId
        })

        this.playlistItems = result.items.map(parseLocalPlaylistVideo)

        if (result.has_continuation) {
          this.continuationData = result
        }

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        if (this.backendPreference === 'local' && this.backendFallback) {
          if (this.fallbackPreference === 'invidious') {
            console.warn('Falling back to Invidious API')
            this.getPlaylistInvidious()
          } else {
            console.warn('Falling back to Piped API')
            this.getPlaylistPiped()
          }
        } else {
          this.isLoading = false
        }
      })
    },

    getPlaylistInvidious: function () {
      this.isLoading = true

      invidiousGetPlaylistInfo(this.playlistId).then((result) => {
        this.infoData = {
          id: result.playlistId,
          title: result.title,
          description: result.description,
          firstVideoId: result.videos[0].videoId,
          viewCount: result.viewCount,
          videoCount: result.videoCount,
          channelName: result.author,
          channelThumbnail: youtubeImageUrlToInvidious(result.authorThumbnails[2].url, this.currentInvidiousInstance),
          channelId: result.authorId,
          infoSource: 'invidious'
        }

        this.updateSubscriptionDetails({
          channelThumbnailUrl: result.authorThumbnails[2].url,
          channelName: this.infoData.channelName,
          channelId: this.infoData.channelId
        })

        const dateString = new Date(result.updated * 1000)
        this.infoData.lastUpdated = dateString.toLocaleDateString(this.currentLocale, { year: 'numeric', month: 'short', day: 'numeric' })

        this.playlistItems = this.playlistItems.concat(result.videos)

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          if (process.env.IS_ELECTRON && this.fallbackPreference === 'local') {
            console.warn('Error getting data with Invidious, falling back to local backend')
            this.getPlaylistLocal()
          } else if (this.fallbackPreference === 'piped') {
            console.warn('Error getting data with Invidious, falling back to Piped backend')
            this.getPlaylistPiped()
          } else {
            this.isLoading = false
          }
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    getPlaylistPiped: async function () {
      try {
        this.isLoading = true
        const { playlist, videos, nextpage } = await getPipedPlaylist(this.playlistId)
        this.infoData = playlist
        this.continuationData = nextpage
        this.playlistItems = this.playlistItems.concat(videos)

        this.updateSubscriptionDetails({
          channelThumbnailUrl: pipedImageToYouTube(playlist.channelThumbnail),
          channelName: playlist.channelName,
          channelId: playlist.channelId
        })
        this.isLoading = false
      } catch (err) {
        console.error(err)
        if (this.backendPreference === 'piped' && this.backendFallback) {
          if (process.env.IS_ELECTRON && this.fallbackPreference === 'local') {
            console.warn('Error getting data with Piped, falling back to local backend')
            this.getPlaylistLocal()
          } else if (this.fallbackPreference === 'invidious') {
            console.warn('Error getting data with Piped, falling back to Invidious backend')
            this.getPlaylistInvidious()
          } else {
            this.isLoading = false
          }
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      }
    },

    getNextPage: function () {
      switch (this.infoData.infoSource) {
        case 'local':
          this.getNextPageLocal()
          break
        case 'invidious':
          console.error('Playlist pagination is not currently supported when the Invidious backend is selected.')
          break
        case 'piped':
          this.getNextPagePiped()
          break
      }
    },

    getNextPageLocal: function () {
      this.isLoadingMore = true

      getLocalPlaylistContinuation(this.continuationData).then((result) => {
        if (result) {
          const parsedVideos = result.items.map(parseLocalPlaylistVideo)
          this.playlistItems = this.playlistItems.concat(parsedVideos)

          if (result.has_continuation) {
            this.continuationData = result
          } else {
            this.continuationData = null
          }
        } else {
          this.continuationData = null
        }

        this.isLoadingMore = false
      })
    },

    getNextPagePiped: async function() {
      this.isLoadingMore = true
      const { videos, nextpage } = await getPipedPlaylistMore({
        playlistId: this.playlistId,
        continuation: this.continuationData
      })

      this.playlistItems = this.playlistItems.concat(videos)
      if (nextpage) {
        this.continuationData = nextpage
      } else {
        this.continuationData = null
      }
      this.isLoadingMore = false
    },

    ...mapActions([
      'updateSubscriptionDetails'
    ]),

    ...mapMutations([
      'setCachedPlaylist'
    ])
  }
})
