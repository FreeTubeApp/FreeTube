import { defineComponent } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import debounce from 'lodash.debounce'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import PlaylistInfo from '../../components/playlist-info/playlist-info.vue'
import FtListVideoLazy from '../../components/ft-list-video-lazy/ft-list-video-lazy.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import { getLocalPlaylist, parseLocalPlaylistVideo } from '../../helpers/api/local'
import { extractNumberFromString, showToast } from '../../helpers/utils'
import { invidiousGetPlaylistInfo, youtubeImageUrlToInvidious } from '../../helpers/api/invidious'

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
      viewCount: 0,
      videoCount: 0,
      lastUpdated: undefined,
      channelName: '',
      channelThumbnail: '',
      channelId: '',
      infoSource: 'local',
      playlistItems: [],
      continuationData: null,
      isLoadingMore: false,
      getPlaylistInfoDebounce: function() {},
      playlistInEditMode: false,
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
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
      if (this.playlistId == null) { return null }
      if (this.playlistId === '') { return null }

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
  },
  watch: {
    $route () {
      // react to route changes...
      this.getPlaylistInfoDebounce()
    },
    userPlaylistsReady () {
      // Fetch from local store when playlist data ready
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
  mounted: function () {
    this.getPlaylistInfoDebounce = debounce(this.getPlaylistInfo, 100)
    this.getPlaylistInfoDebounce()
  },
  methods: {
    getPlaylistInfo: function () {
      this.isLoading = true
      // `selectedUserPlaylist` result accuracy relies on data being ready
      if (!this.userPlaylistsReady) { return }

      if (this.selectedUserPlaylist != null) {
        this.parseUserPlaylist(this.selectedUserPlaylist)
        return
      }

      switch (this.backendPreference) {
        case 'local':
          this.getPlaylistLocal()
          break
        case 'invidious':
          this.getPlaylistInvidious()
          break
      }
    },
    getPlaylistLocal: function () {
      getLocalPlaylist(this.playlistId).then((result) => {
        this.infoData = {
          id: this.playlistId,
          title: result.info.title,
          description: result.info.description ?? '',
          firstVideoId: result.items[0].id,
          viewCount: extractNumberFromString(result.info.views),
          videoCount: extractNumberFromString(result.info.total_items),
          lastUpdated: result.info.last_updated ?? '',
          channelName: result.info.author?.name ?? '',
          channelThumbnail: result.info.author?.best_thumbnail?.url ?? '',
          channelId: result.info.author?.id,
          infoSource: 'local'
        }

        this.playlistTitle = result.info.title
        this.playlistDescription = result.info.description ?? ''
        this.firstVideoId = result.items[0].id
        this.viewCount = extractNumberFromString(result.info.views)
        this.videoCount = extractNumberFromString(result.info.total_items)
        this.lastUpdated = result.info.last_updated ?? ''
        this.channelName = result.info.author?.name ?? ''
        this.channelThumbnail = result.info.author?.best_thumbnail?.url ?? ''
        this.channelId = result.info.author?.id
        this.infoSource = 'local'

        this.updateSubscriptionDetails({
          channelThumbnailUrl: this.channelThumbnail,
          channelName: this.channelName,
          channelId: this.channelId
        })

        this.playlistItems = result.items.map(parseLocalPlaylistVideo)

        if (result.has_continuation) {
          this.continuationData = result
        }

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        if (this.backendPreference === 'local' && this.backendFallback) {
          console.warn('Falling back to Invidious API')
          this.getPlaylistInvidious()
        } else {
          this.isLoading = false
        }
      })
    },

    getPlaylistInvidious: function () {
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

        this.playlistItems = this.playlistItems.concat(result.videos)

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        if (process.env.IS_ELECTRON && this.backendPreference === 'invidious' && this.backendFallback) {
          console.warn('Error getting data with Invidious, falling back to local backend')
          this.getPlaylistLocal()
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    parseUserPlaylist: function (playlist) {
      this.playlistTitle = playlist.playlistName
      this.playlistDescription = playlist.description ?? ''

      if (playlist.videos.length > 0) {
        this.firstVideoId = playlist.videos[0].videoId
      } else {
        this.firstVideoId = ''
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

    getNextPage: function () {
      switch (this.infoData.infoSource) {
        case 'local':
          this.getNextPageLocal()
          break
        case 'invidious':
          console.error('Playlist pagination is not currently supported when the Invidious backend is selected.')
          break
      }
    },

    getNextPageLocal: function () {
      this.isLoadingMore = true

      this.continuationData.getContinuation().then((result) => {
        const parsedVideos = result.items.map(parseLocalPlaylistVideo)
        this.playlistItems = this.playlistItems.concat(parsedVideos)

        if (result.has_continuation) {
          this.continuationData = result
        } else {
          this.continuationData = null
        }

        this.isLoadingMore = false
      })
    },

    moveVideoUp: function (videoId, timeAdded) {
      const playlistItems = [].concat(this.playlistItems)
      const videoIndex = playlistItems.findIndex((video) => {
        return video.videoId === videoId && video.timeAdded === timeAdded
      })

      if (videoIndex === 0) {
        showToast('This video cannot be moved up.')
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
        showToast('There was an issue with updating this playlist.')
        console.error(e)
      }
    },

    moveVideoDown: function (videoId, timeAdded) {
      const playlistItems = [].concat(this.playlistItems)
      const videoIndex = playlistItems.findIndex((video) => {
        return video.videoId === videoId && video.timeAdded === timeAdded
      })

      if (videoIndex + 1 === playlistItems.length || videoIndex + 1 > playlistItems.length) {
        showToast('This video cannot be moved down.')
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
        showToast('There was an issue with updating this playlist.')
        console.error(e)
      }
    },

    removeVideoFromPlaylist: function (videoId, timeAdded) {
      const payload = {
        _id: this.playlistId,
        videoId: videoId,
        timeAdded: timeAdded,
      }

      try {
        this.removeVideo(payload)
        showToast('Video has been removed')
      } catch (e) {
        showToast('There was a problem with removing this video')
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
