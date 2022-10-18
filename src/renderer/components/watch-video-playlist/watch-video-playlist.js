import Vue from 'vue'
import { mapActions } from 'vuex'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import { copyToClipboard, showToast } from '../../helpers/utils'

export default Vue.extend({
  name: 'WatchVideoPlaylist',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-list-video': FtListVideo
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
      channelThumbnail: '',
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
    if (!process.env.IS_ELECTRON || this.backendPreference === 'invidious') {
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
    goToPlaylist: function () {
      this.$router.push({ path: `/playlist/${this.playlistId}` })
    },

    goToChannel: function () {
      this.$router.push({ path: `/channel/${this.channelId}` })
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

    getPlaylistInformationLocal: function () {
      this.isLoading = true

      this.ytGetPlaylistInfo(this.playlistId).then((result) => {
        this.playlistTitle = result.title
        this.playlistItems = result.items
        this.videoCount = result.estimatedItemCount
        this.channelName = result.author.name
        this.channelThumbnail = result.author.bestAvatar.url
        this.channelId = result.author.channelID

        this.playlistItems = result.items.filter((video) => {
          return !(video.title === '[Private video]' || video.title === '[Deleted video]')
        }).map((video) => {
          if (typeof video.author !== 'undefined') {
            const channelName = video.author.name
            const channelId = video.author.channelID
            video.author = channelName
            video.authorId = channelId
          } else {
            video.author = ''
            video.authorId = ''
          }
          video.videoId = video.id
          video.lengthSeconds = video.duration
          return video
        })

        this.isLoading = false
      }).catch((err) => {
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
      })
    },

    getPlaylistInformationInvidious: function () {
      this.isLoading = true

      const payload = {
        resource: 'playlists',
        id: this.playlistId
      }

      this.invidiousGetPlaylistInfo(payload).then((result) => {
        this.playlistTitle = result.title
        this.videoCount = result.videoCount
        this.channelName = result.author
        this.channelThumbnail = result.authorThumbnails[2].url
        this.channelId = result.authorId
        this.playlistItems = this.playlistItems.concat(result.videos)

        this.isLoading = false
      }).catch((err) => {
        console.error(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        showToast(`${errorMessage}: ${err}`, 10000, () => {
          copyToClipboard(err)
        })
        if (this.backendPreference === 'invidious' && this.backendFallback) {
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
      'ytGetPlaylistInfo',
      'invidiousGetPlaylistInfo'
    ])
  }
})
