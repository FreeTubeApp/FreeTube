import { defineComponent, nextTick } from 'vue'
import { mapMutations } from 'vuex'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtListVideoNumbered from '../ft-list-video-numbered/ft-list-video-numbered.vue'
import { copyToClipboard, setPublishedTimestampsInvidious, showToast } from '../../helpers/utils'
import {
  getLocalPlaylist,
  parseLocalPlaylistVideo,
  untilEndOfLocalPlayList,
} from '../../helpers/api/local'
import { invidiousGetPlaylistInfo } from '../../helpers/api/invidious'

export default defineComponent({
  name: 'WatchVideoPlaylist',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-list-video-numbered': FtListVideoNumbered
  },
  props: {
    playlistId: {
      type: String,
      required: true,
    },
    playlistType: {
      type: String,
      default: null
    },
    videoId: {
      type: String,
      required: true,
    },
    playlistItemId: {
      type: String,
      default: null,
    },
    watchViewLoading: {
      type: Boolean,
      required: true,
    },
  },
  data: function () {
    return {
      isLoading: true,
      shuffleEnabled: false,
      loopEnabled: false,
      reversePlaylist: false,
      pauseOnCurrentVideo: false,
      channelName: '',
      channelId: '',
      playlistTitle: '',
      playlistItems: [],
      randomizedPlaylistItems: [],

      getPlaylistInfoRun: false,
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    isUserPlaylist: function () {
      return this.playlistType === 'user'
    },
    userPlaylistsReady: function () {
      return this.$store.getters.getPlaylistsReady
    },
    selectedUserPlaylist: function () {
      if (this.playlistId == null || this.playlistId === '') { return null }

      return this.$store.getters.getPlaylist(this.playlistId)
    },
    selectedUserPlaylistVideoCount () {
      return this.selectedUserPlaylist?.videos?.length
    },
    selectedUserPlaylistLastUpdatedAt () {
      return this.selectedUserPlaylist?.lastUpdatedAt
    },

    currentVideoIndexZeroBased: function () {
      return this.playlistItems.findIndex((item) => {
        if (item.playlistItemId != null && this.playlistItemId != null) {
          return item.playlistItemId === this.playlistItemId
        } else if (item.videoId != null) {
          return item.videoId === this.videoId
        } else {
          return item.id === this.videoId
        }
      })
    },
    currentVideoIndexOneBased: function () {
      return this.currentVideoIndexZeroBased + 1
    },
    currentVideo: function () {
      return this.playlistItems[this.currentVideoIndexZeroBased]
    },

    playlistVideoCount: function () {
      return this.playlistItems.length
    },

    shouldStopDueToPlaylistEnd: function () {
      if (!this.videoIsLastInInPlaylistItems) { return false }

      // Loop enabled = should not stop
      return !this.loopEnabled
    },

    videoIsLastInInPlaylistItems: function () {
      if (this.shuffleEnabled) {
        return this.videoIndexInPlaylistItems === this.randomizedPlaylistItems.length - 1
      } else {
        return this.videoIndexInPlaylistItems === this.playlistItems.length - 1
      }
    },

    videoIndexInPlaylistItems: function () {
      const playlistItems = this.shuffleEnabled ? this.randomizedPlaylistItems : this.playlistItems

      return playlistItems.findIndex((item) => {
        if (item.playlistItemId != null && this.playlistItemId != null) {
          return item.playlistItemId === this.playlistItemId
        } else if (item.videoId != null) {
          return item.videoId === this.videoId
        } else {
          return item.id === this.videoId
        }
      })
    },
    videoIsFirstPlaylistItem: function () {
      return this.videoIndexInPlaylistItems === 0
    },
    videoIsLastPlaylistItem: function () {
      return this.videoIndexInPlaylistItems === (this.playlistItems.length - 1)
    },
    videoIsNotPlaylistItem: function () {
      return this.videoIndexInPlaylistItems === -1
    },

    playlistPageLinkTo() {
      // For `router-link` attribute `to`
      return {
        path: `/playlist/${this.playlistId}`,
        query: {
          playlistType: this.isUserPlaylist ? 'user' : '',
        },
      }
    },
  },
  watch: {
    userPlaylistsReady: function() {
      this.getPlaylistInfoWithDelay()
    },
    selectedUserPlaylistVideoCount () {
      // Re-fetch from local store when current user playlist updated
      this.parseUserPlaylist(this.selectedUserPlaylist, { allowPlayingVideoRemoval: true })
      this.shufflePlaylistItems()
    },
    selectedUserPlaylistLastUpdatedAt () {
      // Re-fetch from local store when current user playlist updated
      this.parseUserPlaylist(this.selectedUserPlaylist, { allowPlayingVideoRemoval: true })
    },
    videoId: function (newId, oldId) {
      // Check if next video is from the shuffled list or if the user clicked a different video
      if (this.shuffleEnabled) {
        const newVideoIndex = this.randomizedPlaylistItems.findIndex((item) => {
          return item.videoId === newId
        })

        const oldVideoIndex = this.randomizedPlaylistItems.findIndex((item) => {
          return item.videoId === oldId
        })

        if ((newVideoIndex - 1) !== oldVideoIndex) {
          // User clicked a different video than expected. Re-shuffle the list
          this.shufflePlaylistItems()
        }
      }
    },
    watchViewLoading: function (newVal, oldVal) {
      // This component is loaded/rendered before watch view loaded
      if (oldVal && !newVal) {
        // Scroll after watch view loaded, otherwise doesn't work
        // Mainly for Local API
        // nextTick(() => this.scrollToCurrentVideo())
        this.scrollToCurrentVideo()
      }
    },
    isLoading: function (newVal, oldVal) {
      // This component is loaded/rendered before watch view loaded
      if (oldVal && !newVal) {
        // Scroll after this component loaded, otherwise doesn't work
        // Mainly for Invidious API
        // `nextTick` is required (tested via reloading)
        nextTick(() => this.scrollToCurrentVideo())
      }
    },
    playlistId: function (newVal, oldVal) {
      if (oldVal !== newVal) {
        if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious') {
          this.getPlaylistInformationInvidious()
        } else {
          this.getPlaylistInformationLocal()
        }
      }
    },
  },
  mounted: function () {
    const cachedPlaylist = this.$store.getters.getCachedPlaylist
    if (cachedPlaylist?.id === this.playlistId) {
      this.loadCachedPlaylistInformation(cachedPlaylist)
    } else {
      this.getPlaylistInfoWithDelay()
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('previoustrack', this.playPreviousVideo)
      navigator.mediaSession.setActionHandler('nexttrack', this.playNextVideo)
    }
  },
  beforeDestroy: function () {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
    }
  },
  methods: {
    getPlaylistInfoWithDelay: function () {
      if (this.getPlaylistInfoRun) { return }

      this.isLoading = true
      // `selectedUserPlaylist` result accuracy relies on data being ready
      if (this.isUserPlaylist && !this.userPlaylistsReady) { return }

      this.getPlaylistInfoRun = true

      if (this.selectedUserPlaylist != null) {
        this.parseUserPlaylist(this.selectedUserPlaylist)
      } else if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious') {
        this.getPlaylistInformationInvidious()
      } else {
        this.getPlaylistInformationLocal()
      }
    },

    toggleLoop: function () {
      if (this.loopEnabled) {
        this.loopEnabled = false
        showToast(this.$t('Loop is now disabled'))
      } else {
        this.loopEnabled = true
        showToast(this.$t('Loop is now enabled'))
      }
    },

    toggleShuffle: function () {
      if (this.shuffleEnabled) {
        this.shuffleEnabled = false
        showToast(this.$t('Shuffle is now disabled'))
      } else {
        this.shuffleEnabled = true
        showToast(this.$t('Shuffle is now enabled'))
        this.shufflePlaylistItems()
      }
    },

    toggleReversePlaylist: function () {
      this.isLoading = true
      showToast(this.$t('The playlist has been reversed'))

      this.reversePlaylist = !this.reversePlaylist
      // Create a new array to avoid changing array in data store state
      // it could be user playlist or cache playlist
      this.playlistItems = this.playlistItems.toReversed()
      setTimeout(() => {
        this.isLoading = false
      }, 1)
    },

    togglePauseOnCurrentVideo: function () {
      if (this.pauseOnCurrentVideo) {
        this.pauseOnCurrentVideo = false
        showToast(this.$t('Playlist will not pause when current video is finished'))
      } else {
        this.pauseOnCurrentVideo = true
        showToast(this.$t('Playlist will pause when current video is finished'))
      }
    },

    playNextVideo: function () {
      const playlistInfo = {
        playlistId: this.playlistId,
        playlistType: this.playlistType,
      }

      const videoIndex = this.videoIndexInPlaylistItems
      const targetVideoIndex = (this.videoIsNotPlaylistItem || this.videoIsLastPlaylistItem) ? 0 : videoIndex + 1
      if (this.shuffleEnabled) {
        let doShufflePlaylistItems = false
        if (this.videoIsLastPlaylistItem && !this.loopEnabled) {
          showToast(this.$t('The playlist has ended. Enable loop to continue playing'))
          return
        }
        // loopEnabled = true
        if (this.videoIsLastPlaylistItem || this.videoIsNotPlaylistItem) { doShufflePlaylistItems = true }

        const targetPlaylistItem = this.randomizedPlaylistItems[targetVideoIndex]

        this.$router.push(
          {
            path: `/watch/${targetPlaylistItem.videoId}`,
            query: Object.assign(playlistInfo, { playlistItemId: targetPlaylistItem.playlistItemId }),
          }
        )
        showToast(this.$t('Playing Next Video'))
        if (doShufflePlaylistItems) { this.shufflePlaylistItems() }
      } else {
        const targetPlaylistItem = this.playlistItems[targetVideoIndex]

        const stopDueToLoopDisabled = this.videoIsLastPlaylistItem && !this.loopEnabled
        if (stopDueToLoopDisabled) {
          showToast(this.$t('The playlist has ended. Enable loop to continue playing'))
          return
        }

        this.$router.push(
          {
            path: `/watch/${targetPlaylistItem.videoId}`,
            query: Object.assign(playlistInfo, { playlistItemId: targetPlaylistItem.playlistItemId }),
          }
        )
        showToast(this.$t('Playing Next Video'))
      }
    },

    playPreviousVideo: function () {
      showToast(this.$t('Playing Previous Video'))

      const playlistInfo = {
        playlistId: this.playlistId,
        playlistType: this.playlistType,
      }

      const videoIndex = this.videoIndexInPlaylistItems
      const targetVideoIndex = (this.videoIsFirstPlaylistItem || this.videoIsNotPlaylistItem) ? this.playlistItems.length - 1 : videoIndex - 1
      if (this.shuffleEnabled) {
        const targetPlaylistItem = this.randomizedPlaylistItems[targetVideoIndex]

        this.$router.push(
          {
            path: `/watch/${targetPlaylistItem.videoId}`,
            query: Object.assign(playlistInfo, { playlistItemId: targetPlaylistItem.playlistItemId }),
          }
        )
      } else {
        const targetPlaylistItem = this.playlistItems[targetVideoIndex]

        this.$router.push(
          {
            path: `/watch/${targetPlaylistItem.videoId}`,
            query: Object.assign(playlistInfo, { playlistItemId: targetPlaylistItem.playlistItemId }),
          }
        )
      }
    },

    loadCachedPlaylistInformation: async function (cachedPlaylist) {
      this.isLoading = true
      this.getPlaylistInfoRun = true
      this.setCachedPlaylist(null)

      this.playlistTitle = cachedPlaylist.title
      this.channelName = cachedPlaylist.channelName
      this.channelId = cachedPlaylist.channelId

      if (!process.env.SUPPORTS_LOCAL_API || this.backendPreference === 'invidious' || cachedPlaylist.continuationData === null) {
        this.playlistItems = cachedPlaylist.items
      } else {
        const videos = cachedPlaylist.items
        await untilEndOfLocalPlayList(cachedPlaylist.continuationData, (p) => {
          videos.push(...p.items.map(parseLocalPlaylistVideo))
        }, { runCallbackOnceFirst: false })

        this.playlistItems = videos
      }

      this.isLoading = false
    },

    getPlaylistInformationLocal: async function () {
      this.isLoading = true

      try {
        const playlist = await getLocalPlaylist(this.playlistId)

        let channelName

        if (playlist.info.author) {
          channelName = playlist.info.author.name
        } else {
          const subtitle = playlist.info.subtitle.toString()

          const index = subtitle.lastIndexOf('•')
          channelName = subtitle.substring(0, index).trim()
        }

        this.playlistTitle = playlist.info.title
        this.channelName = channelName
        this.channelId = playlist.info.author?.id

        const videos = []
        await untilEndOfLocalPlayList(playlist, (p) => {
          videos.push(...p.items.map(parseLocalPlaylistVideo))
        })

        this.playlistItems = videos

        this.isLoading = false
      } catch (err) {
        console.error(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          showToast(this.$t('Falling back to Invidious API'))
          this.getPlaylistInformationInvidious()
        } else {
          this.isLoading = false
        }
      }
    },

    getPlaylistInformationInvidious: function () {
      this.isLoading = true

      invidiousGetPlaylistInfo(this.playlistId).then((result) => {
        this.playlistTitle = result.title
        this.channelName = result.author
        this.channelId = result.authorId

        setPublishedTimestampsInvidious(result.videos)
        this.playlistItems = this.playlistItems.concat(result.videos)

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (process.env.SUPPORTS_LOCAL_API && this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          this.getPlaylistInformationLocal()
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    parseUserPlaylist: function (playlist, { allowPlayingVideoRemoval = true } = {}) {
      this.playlistTitle = playlist.playlistName
      this.channelName = ''
      this.channelId = ''

      if (this.playlistItems.length === 0 || allowPlayingVideoRemoval) {
        this.playlistItems = playlist.videos
      } else {
        // `this.currentVideo` relies on `playlistItems`
        const latestPlaylistContainsCurrentVideo = playlist.videos.some(v => v.playlistItemId === this.playlistItemId)
        // Only update list of videos if latest video list still contains currently playing video
        if (latestPlaylistContainsCurrentVideo) {
          this.playlistItems = playlist.videos
        }
      }

      if (this.reversePlaylist) {
        this.playlistItems = this.playlistItems.toReversed()
      }

      this.isLoading = false
    },

    shufflePlaylistItems: function () {
      // Prevents the array from affecting the original object
      const remainingItems = [].concat(this.playlistItems)
      const items = []

      items.push(this.currentVideo)
      remainingItems.splice(this.currentVideoIndexZeroBased, 1)

      while (remainingItems.length > 0) {
        const randomInt = Math.floor(Math.random() * remainingItems.length)

        items.push(remainingItems[randomInt])
        remainingItems.splice(randomInt, 1)
      }

      this.randomizedPlaylistItems = items
    },

    scrollToCurrentVideo: function () {
      const container = this.$refs.playlistItems
      const currentVideoItem = (this.$refs.currentVideoItem || [])[0]
      if (container != null && currentVideoItem != null) {
        // Watch view can be ready sooner than this component
        container.scrollTop = currentVideoItem.$el.offsetTop - container.offsetTop
      }
    },

    ...mapMutations([
      'setCachedPlaylist'
    ])
  }
})
