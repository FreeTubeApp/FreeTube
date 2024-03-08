import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import debounce from 'lodash.debounce'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import PlaylistInfo from '../../components/playlist-info/playlist-info.vue'
import FtListVideoNumbered from '../../components/ft-list-video-numbered/ft-list-video-numbered.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import {
  getLocalPlaylist,
  getLocalPlaylistContinuation,
  parseLocalPlaylistVideo,
} from '../../helpers/api/local'
import { extractNumberFromString, showToast } from '../../helpers/utils'
import { invidiousGetPlaylistInfo, youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { getPipedPlaylist, getPipedPlaylistMore, pipedImageToYouTube } from '../../helpers/api/piped'
export default defineComponent({
  name: 'Playlist',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'playlist-info': PlaylistInfo,
    'ft-list-video-numbered': FtListVideoNumbered,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton
  },
  beforeRouteLeave(to, from, next) {
    if (!this.isLoading && !this.isUserPlaylistRequested && to.path.startsWith('/watch') && to.query.playlistId === this.playlistId) {
      this.setCachedPlaylist({
        id: this.playlistId,
        title: this.playlistTitle,
        channelName: this.channelName,
        channelId: this.channelId,
        items: this.playlistItems,
        continuationData: this.continuationData,
      })
    }
    next()
  },
  data: function () {
    return {
      isLoading: true,
      playlistTitle: '',
      playlistDescription: '',
      firstVideoId: '',
      firstVideoPlaylistItemId: '',
      playlistThumbnail: '',
      viewCount: 0,
      videoCount: 0,
      lastUpdated: undefined,
      channelName: '',
      channelThumbnail: '',
      channelId: '',
      infoSource: 'local',
      playlistItems: [],
      userPlaylistVisibleLimit: 100,
      continuationData: null,
      isLoadingMore: false,
      getPlaylistInfoDebounce: function() {},
      playlistInEditMode: false,

      playlistInVideoSearchMode: false,
      videoSearchQuery: '',

      promptOpen: false,
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
    },
    playlistId: function() {
      return this.$route.params.id
    },
    userPlaylistsReady: function () {
      return this.$store.getters.getPlaylistsReady
    },
    selectedUserPlaylist: function () {
      if (!this.isUserPlaylistRequested) { return null }
      if (this.playlistId == null || this.playlistId === '') { return null }

      return this.$store.getters.getPlaylist(this.playlistId)
    },
    selectedUserPlaylistLastUpdatedAt: function () {
      return this.selectedUserPlaylist?.lastUpdatedAt
    },
    selectedUserPlaylistVideos: function () {
      if (this.selectedUserPlaylist != null) {
        return this.selectedUserPlaylist.videos
      } else {
        return []
      }
    },
    selectedUserPlaylistVideoCount: function() {
      return this.selectedUserPlaylistVideos.length
    },

    moreVideoDataAvailable() {
      if (this.isUserPlaylistRequested) {
        return this.userPlaylistVisibleLimit < this.sometimesFilteredUserPlaylistItems.length
      } else {
        return this.continuationData !== null
      }
    },

    isUserPlaylistRequested: function () {
      return this.$route.query.playlistType === 'user'
    },

    quickBookmarkPlaylistId() {
      return this.$store.getters.getQuickBookmarkTargetPlaylistId
    },
    quickBookmarkButtonEnabled() {
      if (this.selectedUserPlaylist == null) { return true }

      return this.selectedUserPlaylist?._id !== this.quickBookmarkPlaylistId
    },

    sometimesFilteredUserPlaylistItems() {
      if (!this.isUserPlaylistRequested) { return this.playlistItems }
      if (this.processedVideoSearchQuery === '') { return this.playlistItems }

      return this.playlistItems.filter((v) => {
        return v.title.toLowerCase().includes(this.processedVideoSearchQuery)
      })
    },
    visiblePlaylistItems: function () {
      if (!this.isUserPlaylistRequested) {
        // No filtering for non user playlists yet
        return this.playlistItems
      }

      if (this.userPlaylistVisibleLimit < this.sometimesFilteredUserPlaylistItems.length) {
        return this.sometimesFilteredUserPlaylistItems.slice(0, this.userPlaylistVisibleLimit)
      } else {
        return this.sometimesFilteredUserPlaylistItems
      }
    },
    processedVideoSearchQuery() {
      return this.videoSearchQuery.trim().toLowerCase()
    },
  },
  watch: {
    $route () {
      // react to route changes...
      this.getPlaylistInfoDebounce()
    },
    userPlaylistsReady () {
      // Fetch from local store when playlist data ready
      if (!this.isUserPlaylistRequested) { return }

      this.getPlaylistInfoDebounce()
    },
    selectedUserPlaylist () {
      // Fetch from local store when current user playlist changed
      this.getPlaylistInfoDebounce()
    },
    selectedUserPlaylistLastUpdatedAt () {
      // Re-fetch from local store when current user playlist updated
      this.getPlaylistInfoDebounce()
    },
    selectedUserPlaylistVideoCount () {
      // Monitoring `selectedUserPlaylistVideos` makes this function called
      // Even when the same array object is returned
      // So length is monitored instead
      // Assuming in user playlist video cannot be swapped without length change

      // Re-fetch from local store when current user playlist videos updated
      this.getPlaylistInfoDebounce()
    },
  },
  created: function () {
    this.getPlaylistInfoDebounce = debounce(this.getPlaylistInfo, 100)
  },
  mounted: function () {
    this.getPlaylistInfoDebounce()
  },
  methods: {
    getPlaylistInfo: function () {
      this.isLoading = true
      // `selectedUserPlaylist` result accuracy relies on data being ready
      if (this.isUserPlaylistRequested && !this.userPlaylistsReady) { return }

      if (this.isUserPlaylistRequested) {
        if (this.selectedUserPlaylist != null) {
          this.parseUserPlaylist(this.selectedUserPlaylist)
        } else {
          this.showUserPlaylistNotFound()
        }
        return
      }

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
      getLocalPlaylist(this.playlistId).then((result) => {
        let channelName

        if (result.info.author) {
          channelName = result.info.author.name
        } else {
          const subtitle = result.info.subtitle.toString()

          const index = subtitle.lastIndexOf('•')
          channelName = subtitle.substring(0, index).trim()
        }

        this.playlistTitle = result.info.title
        this.playlistDescription = result.info.description ?? ''
        this.firstVideoId = result.items[0].id
        this.playlistThumbnail = result.info.thumbnails[0].url
        this.viewCount = extractNumberFromString(result.info.views)
        this.videoCount = extractNumberFromString(result.info.total_items)
        this.lastUpdated = result.info.last_updated ?? ''
        this.channelName = channelName ?? ''
        this.channelThumbnail = result.info.author?.best_thumbnail?.url ?? ''
        this.channelId = result.info.author?.id
        this.infoSource = 'local'

        this.updateSubscriptionDetails({
          channelThumbnailUrl: this.channelThumbnail,
          channelName: this.channelName,
          channelId: this.channelId
        })

        this.playlistItems = result.items.map(parseLocalPlaylistVideo)

        let shouldGetNextPage = false
        if (result.has_continuation) {
          this.continuationData = result
          shouldGetNextPage = this.playlistItems.length < 100
        }
        // To workaround the effect of useless continuation data
        // auto load next page again when no. of parsed items < page size
        if (shouldGetNextPage) { this.getNextPageLocal() }

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
      invidiousGetPlaylistInfo(this.playlistId).then((result) => {
        this.playlistTitle = result.title
        this.playlistDescription = result.description
        this.firstVideoId = result.videos[0].videoId
        this.viewCount = result.viewCount
        this.videoCount = result.videoCount
        this.channelName = result.author
        this.channelThumbnail = youtubeImageUrlToInvidious(result.authorThumbnails[2].url, this.currentInvidiousInstance)
        this.channelId = result.authorId
        this.infoSource = 'invidious'

        this.updateSubscriptionDetails({
          channelThumbnailUrl: result.authorThumbnails[2].url,
          channelName: this.channelName,
          channelId: this.channelId
        })

        const dateString = new Date(result.updated * 1000)
        this.lastUpdated = dateString.toLocaleDateString(this.currentLocale, { year: 'numeric', month: 'short', day: 'numeric' })

        this.playlistItems = result.videos

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
        this.playlistTitle = playlist.title
        this.playlistDescription = playlist.description
        this.firstVideoId = videos.at(0)?.videoId
        this.playlistThumbnail = playlist.thumbnailUrl
        this.viewCount = playlist.viewCount
        this.videoCount = playlist.videoCount
        this.channelName = playlist.channelName
        this.channelThumbnail = playlist.channelThumbnail
        this.channelId = playlist.channelId
        this.infoSource = 'piped'
        this.continuationData = nextpage
        this.playlistItems = videos

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

    parseUserPlaylist: function (playlist) {
      this.playlistTitle = playlist.playlistName
      this.playlistDescription = playlist.description ?? ''

      if (playlist.videos.length > 0) {
        this.firstVideoId = playlist.videos[0].videoId
        this.firstVideoPlaylistItemId = playlist.videos[0].playlistItemId
      } else {
        this.firstVideoId = ''
        this.firstVideoPlaylistItemId = ''
      }
      this.viewCount = 0
      this.videoCount = playlist.videos.length
      const dateString = new Date(playlist.lastUpdatedAt)
      this.lastUpdated = dateString.toLocaleDateString(this.currentLocale, { year: 'numeric', month: 'short', day: 'numeric' })
      this.channelName = ''
      this.channelThumbnail = ''
      this.channelId = ''
      this.infoSource = 'user'

      this.playlistItems = playlist.videos

      this.isLoading = false
    },
    showUserPlaylistNotFound() {
      showToast(this.$t('User Playlists.SinglePlaylistView.Toast.This playlist does not exist'))
    },

    getNextPage: function () {
      switch (this.infoSource) {
        case 'local':
          this.getNextPageLocal()
          break
        case 'user':
          // Stop users from spamming the load more button, by replacing it with a loading symbol until the newly added items are renderered
          this.isLoadingMore = true

          setTimeout(() => {
            if (this.userPlaylistVisibleLimit + 100 < this.videoCount) {
              this.userPlaylistVisibleLimit += 100
            } else {
              this.userPlaylistVisibleLimit = this.videoCount
            }

            this.isLoadingMore = false
          })
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
        let shouldGetNextPage = false

        if (result) {
          const parsedVideos = result.items.map(parseLocalPlaylistVideo)
          this.playlistItems = this.playlistItems.concat(parsedVideos)

          if (result.has_continuation) {
            this.continuationData = result
            // To workaround the effect of useless continuation data
            // auto load next page again when no. of parsed items < page size
            shouldGetNextPage = parsedVideos.length < 100
          } else {
            this.continuationData = null
          }
        } else {
          this.continuationData = null
        }

        this.isLoadingMore = false
        if (shouldGetNextPage) { this.getNextPageLocal() }
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

    moveVideoUp: function (videoId, playlistItemId) {
      const playlistItems = [].concat(this.playlistItems)
      const videoIndex = playlistItems.findIndex((video) => {
        return video.videoId === videoId && video.playlistItemId === playlistItemId
      })

      if (videoIndex === 0) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["This video cannot be moved up."]'))
        return
      }

      const videoObject = playlistItems[videoIndex]

      playlistItems.splice(videoIndex, 1)
      playlistItems.splice(videoIndex - 1, 0, videoObject)

      const playlist = {
        playlistName: this.playlistTitle,
        protected: this.selectedUserPlaylist.protected,
        description: this.playlistDescription,
        videos: playlistItems,
        _id: this.playlistId
      }
      try {
        this.updatePlaylist(playlist)
        this.playlistItems = playlistItems
      } catch (e) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["There was an issue with updating this playlist."]'))
        console.error(e)
      }
    },

    moveVideoDown: function (videoId, playlistItemId) {
      const playlistItems = [].concat(this.playlistItems)
      const videoIndex = playlistItems.findIndex((video) => {
        return video.videoId === videoId && video.playlistItemId === playlistItemId
      })

      if (videoIndex + 1 === playlistItems.length || videoIndex + 1 > playlistItems.length) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["This video cannot be moved down."]'))
        return
      }

      const videoObject = playlistItems[videoIndex]

      playlistItems.splice(videoIndex, 1)
      playlistItems.splice(videoIndex + 1, 0, videoObject)

      const playlist = {
        playlistName: this.playlistTitle,
        protected: this.selectedUserPlaylist.protected,
        description: this.playlistDescription,
        videos: playlistItems,
        _id: this.playlistId
      }
      try {
        this.updatePlaylist(playlist)
        this.playlistItems = playlistItems
      } catch (e) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast["There was an issue with updating this playlist."]'))
        console.error(e)
      }
    },

    removeVideoFromPlaylist: function (videoId, playlistItemId) {
      try {
        this.removeVideo({
          _id: this.playlistId,
          videoId: videoId,
          playlistItemId: playlistItemId,
        })
        // Update playlist's `lastUpdatedAt`
        this.updatePlaylist({ _id: this.playlistId })
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast.Video has been removed'))
      } catch (e) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast.There was a problem with removing this video'))
        console.error(e)
      }
    },

    ...mapActions([
      'updateSubscriptionDetails',
      'updatePlaylist',
      'removeVideo',
    ]),

    ...mapMutations([
      'setCachedPlaylist'
    ])
  }
})
