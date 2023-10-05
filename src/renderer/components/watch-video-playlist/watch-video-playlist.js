import { defineComponent, nextTick } from 'vue'
import { mapMutations } from 'vuex'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtListVideoLazy from '../ft-list-video-lazy/ft-list-video-lazy.vue'
import { copyToClipboard, showToast } from '../../helpers/utils'
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
    'ft-list-video-lazy': FtListVideoLazy,
  },
  props: {
    playlistId: {
      type: String,
      required: true
    },
    videoId: {
      type: String,
      required: true
    },
    watchViewLoading: {
      type: Boolean,
      required: true
    },
  },
  data: function () {
    return {
      isLoading: false,
      shuffleEnabled: false,
      loopEnabled: false,
      reversePlaylist: false,
      pauseOnCurrentVideo: false,
      channelName: '',
      channelId: '',
      playlistTitle: '',
      playlistItems: [],
      randomizedPlaylistItems: [],
    }
  },
  computed: {
    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    currentVideoIndex: function () {
      const index = this.playlistItems.findIndex((item) => {
        if (typeof item.videoId !== 'undefined') {
          return item.videoId === this.videoId
        } else {
          return item.id === this.videoId
        }
      })

      return index + 1
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
      if (this.shuffleEnabled) {
        return this.randomizedPlaylistItems.findIndex((item) => {
          return item === this.videoId
        })
      } else {
        return this.playlistItems.findIndex((item) => {
          return (item.id ?? item.videoId) === this.videoId
        })
      }
    },
  },
  watch: {
    videoId: function (newId, oldId) {
      // Check if next video is from the shuffled list or if the user clicked a different video
      if (this.shuffleEnabled) {
        const newVideoIndex = this.randomizedPlaylistItems.findIndex((item) => {
          return item === newId
        })

        const oldVideoIndex = this.randomizedPlaylistItems.findIndex((item) => {
          return item === oldId
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
        if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
          this.getPlaylistInformationInvidious()
        } else {
          this.getPlaylistInformationLocal()
        }
      }
    }
  },
  mounted: function () {
    const cachedPlaylist = this.$store.getters.getCachedPlaylist

    if (cachedPlaylist?.id === this.playlistId) {
      this.loadCachedPlaylistInformation(cachedPlaylist)
    } else if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
      this.getPlaylistInformationInvidious()
    } else {
      this.getPlaylistInformationLocal()
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
      this.playlistItems = this.playlistItems.reverse()
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
        playlistId: this.playlistId
      }

      if (this.shuffleEnabled) {
        const videoIndex = this.randomizedPlaylistItems.findIndex((item) => {
          return item === this.videoId
        })

        if (videoIndex === this.randomizedPlaylistItems.length - 1) {
          if (this.loopEnabled) {
            this.$router.push(
              {
                path: `/watch/${this.randomizedPlaylistItems[0]}`,
                query: playlistInfo
              }
            )
            showToast(this.$t('Playing Next Video'))
            this.shufflePlaylistItems()
          } else {
            showToast(this.$t('The playlist has ended. Enable loop to continue playing'))
          }
        } else {
          this.$router.push(
            {
              path: `/watch/${this.randomizedPlaylistItems[videoIndex + 1]}`,
              query: playlistInfo
            }
          )
          showToast(this.$t('Playing Next Video'))
        }
      } else {
        const videoIndex = this.playlistItems.findIndex((item) => {
          return (item.id ?? item.videoId) === this.videoId
        })

        if (videoIndex === this.playlistItems.length - 1) {
          if (this.loopEnabled) {
            this.$router.push(
              {
                path: `/watch/${this.playlistItems[0].id ?? this.playlistItems[0].videoId}`,
                query: playlistInfo
              }
            )
            showToast(this.$t('Playing Next Video'))
          } else {
            showToast(this.$t('The playlist has ended. Enable loop to continue playing'))
          }
        } else {
          this.$router.push(
            {
              path: `/watch/${this.playlistItems[videoIndex + 1].id ?? this.playlistItems[videoIndex + 1].videoId}`,
              query: playlistInfo
            }
          )
          showToast(this.$t('Playing Next Video'))
        }
      }
    },

    playPreviousVideo: function () {
      showToast('Playing previous video')

      const playlistInfo = {
        playlistId: this.playlistId
      }

      if (this.shuffleEnabled) {
        const videoIndex = this.randomizedPlaylistItems.findIndex((item) => {
          return item === this.videoId
        })

        if (videoIndex === 0) {
          this.$router.push(
            {
              path: `/watch/${this.randomizedPlaylistItems[this.randomizedPlaylistItems.length - 1]}`,
              query: playlistInfo
            }
          )
        } else {
          this.$router.push(
            {
              path: `/watch/${this.randomizedPlaylistItems[videoIndex - 1]}`,
              query: playlistInfo
            }
          )
        }
      } else {
        const videoIndex = this.playlistItems.findIndex((item) => {
          return (item.id ?? item.videoId) === this.videoId
        })

        if (videoIndex === 0) {
          this.$router.push(
            {
              path: `/watch/${this.playlistItems[this.randomizedPlaylistItems.length - 1].id ?? this.playlistItems[this.randomizedPlaylistItems.length - 1].videoId}`,
              query: playlistInfo
            }
          )
        } else {
          this.$router.push(
            {
              path: `/watch/${this.playlistItems[videoIndex - 1].id ?? this.playlistItems[videoIndex - 1].videoId}`,
              query: playlistInfo
            }
          )
        }
      }
    },

    loadCachedPlaylistInformation: async function (cachedPlaylist) {
      this.isLoading = true
      this.setCachedPlaylist(null)

      this.playlistTitle = cachedPlaylist.title
      this.channelName = cachedPlaylist.channelName
      this.channelId = cachedPlaylist.channelId

      if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious' || cachedPlaylist.continuationData === null) {
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
        this.playlistItems = this.playlistItems.concat(result.videos)

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (process.env.IS_ELECTRON && this.backendPreference === 'invidious' && this.backendFallback) {
          showToast(this.$t('Falling back to Local API'))
          this.getPlaylistInformationLocal()
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    shufflePlaylistItems: function () {
      // Prevents the array from affecting the original object
      const remainingItems = [].concat(this.playlistItems)
      const items = []

      items.push(this.videoId)

      this.playlistItems.forEach((item) => {
        const randomInt = Math.floor(Math.random() * remainingItems.length)

        if ((remainingItems[randomInt].id ?? remainingItems[randomInt].videoId) !== this.videoId) {
          items.push(remainingItems[randomInt].id ?? remainingItems[randomInt].videoId)
        }

        remainingItems.splice(randomInt, 1)
      })

      this.randomizedPlaylistItems = items
    },

    scrollToCurrentVideo: function () {
      const container = this.$refs.playlistItems
      const currentVideoItem = (this.$refs.currentVideoItem || [])[0]
      if (container != null && currentVideoItem != null) {
        // Watch view can be ready sooner than this component
        container.scrollTop = currentVideoItem.offsetTop - container.offsetTop
      }
    },

    ...mapMutations([
      'setCachedPlaylist'
    ])
  }
})
