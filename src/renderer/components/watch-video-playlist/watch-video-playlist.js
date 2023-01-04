import Vue from 'vue'
import { mapActions, mapMutations } from 'vuex'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtListVideoLazy from '../ft-list-video-lazy/ft-list-video-lazy.vue'
import { copyToClipboard, showToast } from '../../helpers/utils'
import { getLocalPlaylist, parseLocalPlaylistVideo } from '../../helpers/api/local'

export default Vue.extend({
  name: 'WatchVideoPlaylist',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-list-video-lazy': FtListVideoLazy
  },
  props: {
    playlistId: {
      type: String,
      required: true
    },
    videoId: {
      type: String,
      required: true
    }
  },
  data: function () {
    return {
      isLoading: false,
      shuffleEnabled: false,
      loopEnabled: false,
      reversePlaylist: false,
      channelName: '',
      channelId: '',
      playlistTitle: '',
      playlistItems: [],
      randomizedPlaylistItems: []
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
    }
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
            showToast(this.$t('The playlist has ended.  Enable loop to continue playing'))
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
          }
          showToast(this.$t('The playlist has ended.  Enable loop to continue playing'))
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
        const items = cachedPlaylist.items
        let playlist = cachedPlaylist.continuationData

        do {
          playlist = await playlist.getContinuation()

          const parsedVideos = playlist.items.map(parseLocalPlaylistVideo)
          items.push(...parsedVideos)

          if (!playlist.has_continuation) {
            playlist = null
          }
        } while (playlist !== null)

        this.playlistItems = items
      }

      this.isLoading = false
    },

    getPlaylistInformationLocal: async function () {
      this.isLoading = true

      try {
        let playlist = await getLocalPlaylist(this.playlistId)

        this.playlistTitle = playlist.info.title
        this.channelName = playlist.info.author?.name
        this.channelId = playlist.info.author?.id

        const videos = playlist.items.map(parseLocalPlaylistVideo)

        while (playlist.has_continuation) {
          playlist = await playlist.getContinuation()

          const parsedVideos = playlist.items.map(parseLocalPlaylistVideo)
          videos.push(...parsedVideos)
        }

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

      const payload = {
        resource: 'playlists',
        id: this.playlistId
      }

      this.invidiousGetPlaylistInfo(payload).then((result) => {
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

    ...mapActions([
      'invidiousGetPlaylistInfo'
    ]),

    ...mapMutations([
      'setCachedPlaylist'
    ])
  }
})
