import { defineComponent, nextTick } from 'vue'
import { mapActions, mapMutations } from 'vuex'
import debounce from 'lodash.debounce'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import PlaylistInfo from '../../components/playlist-info/playlist-info.vue'
import FtListVideoNumbered from '../../components/ft-list-video-numbered/ft-list-video-numbered.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
import FtAutoLoadNextPageWrapper from '../../components/ft-auto-load-next-page-wrapper/ft-auto-load-next-page-wrapper.vue'
import {
  getLocalPlaylist,
  getLocalPlaylistContinuation,
  parseLocalPlaylistVideo,
} from '../../helpers/api/local'
import {
  extractNumberFromString,
  getIconForSortPreference,
  setPublishedTimestampsInvidious,
  showToast,
  deepCopy,
} from '../../helpers/utils'
import { invidiousGetPlaylistInfo, youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { getSortedPlaylistItems, videoDurationPresent, videoDurationWithFallback, SORT_BY_VALUES } from '../../helpers/playlists'
import packageDetails from '../../../../package.json'
import { MOBILE_WIDTH_THRESHOLD, PLAYLIST_HEIGHT_FORCE_LIST_THRESHOLD } from '../../../constants'

export default defineComponent({
  name: 'Playlist',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'playlist-info': PlaylistInfo,
    'ft-list-video-numbered': FtListVideoNumbered,
    'ft-flex-box': FtFlexBox,
    'ft-button': FtButton,
    'ft-element-list': FtElementList,
    'ft-select': FtSelect,
    'ft-auto-load-next-page-wrapper': FtAutoLoadNextPageWrapper,
  },
  beforeRouteLeave(to, from, next) {
    if (!this.isLoading && to.path.startsWith('/watch') && to.query.playlistId === this.playlistId) {
      this.setCachedPlaylist({
        id: this.playlistId,
        title: this.playlistTitle,
        channelName: this.channelName,
        channelId: this.channelId,
        items: this.sortedPlaylistItems,
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
      forceListView: false,
      alreadyShownNotice: false,

      videoSearchQuery: '',

      promptOpen: false,
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },
    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },
    currentInvidiousInstanceUrl: function () {
      return this.$store.getters.getCurrentInvidiousInstanceUrl
    },
    userPlaylistSortOrder: function () {
      return this.$store.getters.getUserPlaylistSortOrder
    },
    sortOrder: function () {
      return this.isUserPlaylistRequested ? this.userPlaylistSortOrder : SORT_BY_VALUES.Custom
    },
    currentLocale: function () {
      return this.$i18n.locale
    },
    playlistId: function() {
      return this.$route.params.id
    },
    listType: function () {
      return this.isUserPlaylistRequested && !this.forceListView ? this.$store.getters.getListType : 'list'
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
    playlistInVideoSearchMode() {
      return this.processedVideoSearchQuery !== ''
    },
    searchQueryTextRequested() {
      return this.$route.query.searchQueryText ?? ''
    },
    searchQueryTextPresent() {
      const searchQueryText = this.searchQueryTextRequested
      return typeof searchQueryText === 'string' && searchQueryText !== ''
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
      if (!this.isUserPlaylistRequested) { return this.sortedPlaylistItems }
      if (this.processedVideoSearchQuery === '') { return this.sortedPlaylistItems }

      return this.sortedPlaylistItems.filter((v) => {
        if (typeof (v.title) === 'string' && v.title.toLowerCase().includes(this.processedVideoSearchQuery)) {
          return true
        } else if (typeof (v.author) === 'string' && v.author.toLowerCase().includes(this.processedVideoSearchQuery)) {
          return true
        }

        return false
      })
    },
    sortByValues() {
      return Object.values(SORT_BY_VALUES)
    },
    isSortOrderCustom() {
      return this.sortOrder === SORT_BY_VALUES.Custom
    },
    sortedPlaylistItems: function () {
      if (
        this.sortOrder === SORT_BY_VALUES.VideoDurationAscending ||
        this.sortOrder === SORT_BY_VALUES.VideoDurationDescending
      ) {
        const playlistItems = this.getPlaylistItemsWithDuration()
        return getSortedPlaylistItems(playlistItems, this.sortOrder, this.currentLocale)
      }
      return getSortedPlaylistItems(this.playlistItems, this.sortOrder, this.currentLocale)
    },
    visiblePlaylistItems: function () {
      if (!this.isUserPlaylistRequested) {
        // No filtering for non user playlists yet
        return this.sortedPlaylistItems
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
    sortBySelectNames() {
      return this.sortByValues.map((k) => {
        switch (k) {
          case SORT_BY_VALUES.Custom:
            return this.$t('Playlist.Sort By.Custom')
          case SORT_BY_VALUES.DateAddedNewest:
            return this.$t('Playlist.Sort By.DateAddedNewest')
          case SORT_BY_VALUES.DateAddedOldest:
            return this.$t('Playlist.Sort By.DateAddedOldest')
          case SORT_BY_VALUES.VideoTitleAscending:
            return this.$t('Playlist.Sort By.VideoTitleAscending')
          case SORT_BY_VALUES.VideoTitleDescending:
            return this.$t('Playlist.Sort By.VideoTitleDescending')
          case SORT_BY_VALUES.AuthorAscending:
            return this.$t('Playlist.Sort By.AuthorAscending')
          case SORT_BY_VALUES.AuthorDescending:
            return this.$t('Playlist.Sort By.AuthorDescending')
          case SORT_BY_VALUES.VideoDurationAscending:
            return this.$t('Playlist.Sort By.VideoDurationAscending')
          case SORT_BY_VALUES.VideoDurationDescending:
            return this.$t('Playlist.Sort By.VideoDurationDescending')
          default:
            console.error(`Unknown sort: ${k}`)
            return k
        }
      })
    },
    sortBySelectValues() {
      return this.sortByValues
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

    if (this.isUserPlaylistRequested && this.searchQueryTextPresent) {
      this.videoSearchQuery = this.searchQueryTextRequested
    }
  },
  mounted: function () {
    this.getPlaylistInfoDebounce()
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy: function () {
    window.removeEventListener('resize', this.handleResize)
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

        const playlistItems = result.items.map(parseLocalPlaylistVideo)

        this.playlistTitle = result.info.title
        this.playlistDescription = result.info.description ?? ''
        this.firstVideoId = playlistItems[0].videoId
        this.playlistThumbnail = result.info.thumbnails[0].url
        this.viewCount = result.info.views.toLowerCase() === 'no views' ? 0 : extractNumberFromString(result.info.views)
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

        this.playlistItems = playlistItems

        let shouldGetNextPage = false
        if (result.has_continuation) {
          this.continuationData = result
          shouldGetNextPage = this.playlistItems.length < 100
        }
        // To workaround the effect of useless continuation data
        // auto load next page again when no. of parsed items < page size
        if (shouldGetNextPage) { this.getNextPageLocal() }

        this.updatePageTitle()

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
        this.playlistTitle = result.title
        this.playlistDescription = result.description
        this.firstVideoId = result.videos[0].videoId
        this.viewCount = result.viewCount
        this.videoCount = result.videoCount
        this.channelName = result.author
        this.channelThumbnail = youtubeImageUrlToInvidious(result.authorThumbnails[2].url, this.currentInvidiousInstanceUrl)
        this.channelId = result.authorId
        this.infoSource = 'invidious'

        this.updateSubscriptionDetails({
          channelThumbnailUrl: result.authorThumbnails[2].url,
          channelName: this.channelName,
          channelId: this.channelId
        })

        const dateString = new Date(result.updated * 1000)
        this.lastUpdated = dateString.toLocaleDateString(this.currentLocale, { year: 'numeric', month: 'short', day: 'numeric' })

        setPublishedTimestampsInvidious(result.videos)

        this.playlistItems = result.videos

        this.updatePageTitle()

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        if (process.env.SUPPORTS_LOCAL_API && this.backendPreference === 'invidious' && this.backendFallback) {
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

      this.updatePageTitle()

      this.isLoading = false
    },

    showUserPlaylistNotFound() {
      showToast(this.$t('User Playlists.SinglePlaylistView.Toast.This playlist does not exist'))
    },

    getPlaylistItemsWithDuration() {
      const modifiedPlaylistItems = deepCopy(this.playlistItems)
      let anyVideoMissingDuration = false
      modifiedPlaylistItems.forEach(video => {
        if (videoDurationPresent(video)) { return }

        const videoHistory = this.$store.getters.getHistoryCacheById[video.videoId]
        if (typeof videoHistory !== 'undefined') {
          const fetchedLengthSeconds = videoDurationWithFallback(videoHistory)
          video.lengthSeconds = fetchedLengthSeconds
          // if the video duration is 0, it will be the fallback value, so mark it as missing a duration
          if (fetchedLengthSeconds === 0) { anyVideoMissingDuration = true }
        } else {
          // Mark at least one video have no duration, show notice later
          // Also assign fallback duration here
          anyVideoMissingDuration = true
          video.lengthSeconds = 0
        }
      })

      // Show notice if not already shown before returning playlist items
      if (anyVideoMissingDuration && !this.alreadyShownNotice) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast.This playlist has a video with a duration error'), 5000)
        this.alreadyShownNotice = true
      }

      return modifiedPlaylistItems
    },

    getNextPage: function () {
      switch (this.infoSource) {
        case 'local':
          this.getNextPageLocal()
          break
        case 'user':
          // Stop users from spamming the load more button, by replacing it with a loading symbol until the newly added items are renderered
          this.isLoadingMore = true

          nextTick(() => {
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

    addVideoBackToPlaylist: function(videoData) {
      try {
        this.addVideo({
          _id: this.playlistId,
          videoData: videoData
        });

        // Update playlist's `lastUpdatedAt`
        this.updatePlaylist({ _id: this.playlistId });
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast.Video has been added back to playlist'), 3000);
      } catch (e) {
        showToast(this.$t('User Playlists.SinglePlaylistView.Toast.There was a problem with adding this video back to playlist'));
        console.error(e);
      }
    },

    removeVideoFromPlaylist: function (videoData) {
      try {
		this.removeVideo({
		  _id: this.playlistId,
		  videoId: videoData.videoId,
		  playlistItemId: videoData.playlistItemId,
		})

		// Update playlist's `lastUpdatedAt`
		this.updatePlaylist({ _id: this.playlistId })
		showToast(this.$t('User Playlists.SinglePlaylistView.Toast["Video has been removed. Click here to undo."]'), 3000, () => {
		  this.addVideoBackToPlaylist(videoData);
		}
	      );
	      } catch (e) {
		showToast(this.$t('User Playlists.SinglePlaylistView.Toast.There was a problem with removing this video'))
		console.error(e)
	      }

    },

    updatePageTitle() {
      const playlistTitle = this.playlistTitle
      const channelName = this.channelName
      const titleText = [
        playlistTitle,
        channelName,
      ].filter(v => v).join(' | ')
      document.title = `${titleText} - ${packageDetails.productName}`
    },

    handleResize: function () {
      this.forceListView = window.innerWidth <= MOBILE_WIDTH_THRESHOLD || window.innerHeight <= PLAYLIST_HEIGHT_FORCE_LIST_THRESHOLD
    },

    getIconForSortPreference: (s) => getIconForSortPreference(s),

    ...mapActions([
      'updateSubscriptionDetails',
      'updatePlaylist',
      'updateUserPlaylistSortOrder',
      'removeVideo',
      'addVideo'
    ]),

    ...mapMutations([
      'setCachedPlaylist'
    ])
  }
})
