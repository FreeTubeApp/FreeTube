import Vue from 'vue'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'

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
      channelName: '',
      channelId: '',
      channelThumbnail: '',
      playlistTitle: '',
      playlistItems: [],
      playlistWatchedVideoList: []
    }
  },
  computed: {
    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    currentVideoIndex: function () {
      const index = this.playlistItems.findIndex((item) => {
        return item.videoId === this.videoId
      })

      return index + 1
    },

    playlistVideoCount: function () {
      return this.playlistItems.length
    }
  },
  watch: {
    videoId () {
      this.playlistWatchedVideoList.push(this.videoId)
    }
  },
  mounted: function () {
    if (this.usingElectron) {
      this.getPlaylistInformationInvidious()
    } else {
      switch (this.backendPreference) {
        case 'local':
          this.getPlaylistInformationLocal()
          break
        case 'invidious':
          this.getPlaylistInformationInvidious()
          break
      }
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
        console.log('Disabling loop')
      } else {
        this.loopEnabled = true
        console.log('Enabling loop')
      }
    },

    toggleShuffle: function () {
      if (this.shuffleEnabled) {
        this.shuffleEnabled = false
        console.log('Disabling shuffle')
      } else {
        this.shuffleEnabled = true
        console.log('Enabling shuffle')
      }
    },

    playNextVideo: function () {
      const playlistInfo = {
        playlistId: this.playlistId
      }

      const videoIndex = this.playlistItems.findIndex((item) => {
        return item.videoId === this.videoId
      })

      const videosRemain = this.playlistWatchedVideoList.length < this.playlistItems.length

      if (this.shuffleEnabled && videosRemain) {
        let runLoop = true
        while (runLoop) {
          const randomInt = Math.floor(Math.random() * this.playlistItems.length)
          const randomVideoId = this.playlistItems[randomInt].videoId

          const watchedIndex = this.playlistWatchedVideoList.findIndex((watchedVideo) => {
            return watchedVideo === randomVideoId
          })

          if (watchedIndex === -1) {
            runLoop = false
            this.$router.push(
              {
                path: `/watch/${randomVideoId}`,
                query: playlistInfo
              }
            )
            break
          }
        }
      } else if (this.shuffleEnabled && !videosRemain) {
        if (this.loopEnabled) {
          let runLoop = true
          while (runLoop) {
            const randomInt = Math.floor(Math.random() * this.playlistItems.length)
            const randomVideoId = this.playlistItems[randomInt].videoId

            if (this.videoId !== randomVideoId) {
              this.playlistItems = []
              runLoop = false
              this.$router.push(
                {
                  path: `/watch/${randomVideoId}`,
                  query: playlistInfo
                }
              )
              break
            }
          }
        }
      } else if (this.loopEnabled && videoIndex === this.playlistItems.length - 1) {
        this.$router.push(
          {
            path: `/watch/${this.playlistItems[0].videoId}`,
            query: playlistInfo
          }
        )
      } else if (videoIndex < this.playlistItems.length - 1 && videosRemain) {
        this.$router.push(
          {
            path: `/watch/${this.playlistItems[videoIndex + 1].videoId}`,
            query: playlistInfo
          }
        )
      }
    },

    playPreviousVideo: function () {
      const playlistInfo = {
        playlistId: this.playlistId
      }

      const watchedIndex = this.playlistItems.findIndex((watchedVideo) => {
        return watchedVideo.videoId === this.videoId
      })

      if (this.shuffleEnabled && this.playlistWatchedVideoList.length > 1) {
        this.playlistWatchedVideoList.pop()
        const lastVideo = this.playlistWatchedVideoList.pop()
        this.$router.push(
          {
            path: `/watch/${lastVideo}`,
            query: playlistInfo
          }
        )
      } else if (watchedIndex === 0) {
        const videoId = this.playlistItems[this.playlistItems.length - 1].videoId
        this.$router.push(
          {
            path: `/watch/${videoId}`,
            query: playlistInfo
          }
        )
      } else {
        const videoId = this.playlistItems[watchedIndex - 1].videoId
        this.$router.push(
          {
            path: `/watch/${videoId}`,
            query: playlistInfo
          }
        )
      }
    },

    getPlaylistInformationLocal: function () {
      this.isLoading = true

      this.$store.dispatch('ytGetPlaylistInfo', this.playlistId).then((result) => {
        console.log('done')
        console.log(result)

        this.playlistTitle = result.title
        this.playlistItems = result.items
        this.videoCount = result.total_items
        this.channelName = result.author.name
        this.channelThumbnail = result.author.avatar
        this.channelId = result.author.id

        this.playlistItems = result.items

        this.playlistWatchedVideoList.push(this.videoId)
        this.isLoading = false
      }).catch((err) => {
        console.log(err)
        if (this.backendPreference === 'local' && this.backendFallback) {
          console.log('Falling back to Invidious API')
          this.getPlaylistInformationInvidious()
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    getPlaylistInformationInvidious: function () {
      this.isLoading = true

      const payload = {
        resource: 'playlists',
        id: this.playlistId,
        params: {
          page: this.playlistPage
        }
      }

      this.$store.dispatch('invidiousGetPlaylistInfo', payload).then((result) => {
        console.log('done')
        console.log(result)

        this.playlistTitle = result.title
        this.videoCount = result.videoCount
        this.channelName = result.author
        this.channelThumbnail = result.authorThumbnails[2].url
        this.channelId = result.authorId
        this.playlistItems = this.playlistItems.concat(result.videos)

        if (this.playlistItems.length < result.videoCount) {
          console.log('getting next page')
          this.playlistPage++
          this.getPlaylistInformationInvidious()
        } else {
          this.playlistWatchedVideoList.push(this.videoId)
          this.isLoading = false
        }
      }).catch((err) => {
        console.log(err)
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          console.log('Error getting data with Invidious, falling back to local backend')
          this.getPlaylistInformationLocal()
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    }
  }
})
