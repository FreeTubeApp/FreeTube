import Vue from 'vue'
import { mapActions } from 'vuex'
import FtLoader from '../ft-loader/ft-loader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtListVideo from '../ft-list-video/ft-list-video.vue'
import channelBlockerMixin from '../../mixins/channelblocker'

export default Vue.extend({
  name: 'WatchVideoPlaylist',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'ft-flex-box': FtFlexBox,
    'ft-list-video': FtListVideo
  },
  mixins: [
    channelBlockerMixin
  ],
  props: {
    playlistId: {
      type: String,
      required: true
    },
    videoId: {
      type: String,
      required: true
    },
    videoBlocked: {
      type: Boolean,
      default: false
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
      playlistItems: [], // just for display
      activePlaylistItems: [], // manipulate this
      nextUnblockedVideoId: '',
      previousUnblockedVideoId: ''
    }
  },
  computed: {
    isDev: function () {
      return process.env.NODE_ENV === 'development'
    },

    usingElectron: function () {
      return this.$store.getters.getUsingElectron
    },

    backendPreference: function () {
      return this.$store.getters.getBackendPreference
    },

    backendFallback: function () {
      return this.$store.getters.getBackendFallback
    },

    videoIndexOriginalPlaylist: function () {
      return this.playlistItems.findIndex((item) => {
        return item.videoId === this.videoId
      })
    },

    videoIndexActivePlaylist: function() {
      return this.activePlaylistItems.findIndex((video) => {
        return video.videoId === this.videoId
      })
    },

    isEndOfPlaylist: function() {
      return this.videoIndexActivePlaylist === this.playlistVideoCount - 1
    },

    playlistVideoCount: function () {
      return this.playlistItems.length
    }
  },
  watch: {
    videoId: function (newId, oldId) {
      // Check if next video is from the shuffled list or if the user clicked a different video
      if (this.shuffleEnabled) {
        const newVideoIndex = this.activePlaylistItems.findIndex((item) => {
          return item === newId
        })

        const oldVideoIndex = this.activePlaylistItems.findIndex((item) => {
          return item === oldId
        })

        if ((newVideoIndex - 1) !== oldVideoIndex) {
          // User clicked a different video than expected. Re-shuffle the list
          this.shufflePlaylistItems()
        }
      }
      this.findNextUnblockedVideoInPlaylist()
    },

    videoBlocked: function() {
      this.findNextUnblockedVideoInPlaylist()
    }
  },
  mounted: function () {
    if (!this.usingElectron) {
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
        this.showToast({
          message: this.$t('Loop is now disabled')
        })
      } else {
        this.loopEnabled = true
        this.showToast({
          message: this.$t('Loop is now enabled')
        })
      }
      this.findNextUnblockedVideoInPlaylist()
    },

    toggleShuffle: function () {
      if (this.shuffleEnabled) {
        this.shuffleEnabled = false
        this.showToast({
          message: this.$t('Shuffle is now disabled')
        })
        this.activePlaylistItems = this.playlistItems.concat([])
      } else {
        this.shuffleEnabled = true
        this.showToast({
          message: this.$t('Shuffle is now enabled')
        })
        this.shufflePlaylistItems()
      }
      this.findNextUnblockedVideoInPlaylist()
    },

    toggleReversePlaylist: function () {
      this.isLoading = true
      this.showToast({
        message: this.$t('The playlist has been reversed')
      })

      this.reversePlaylist = !this.reversePlaylist
      this.playlistItems.reverse()
      this.activePlaylistItems.reverse()
      this.findNextUnblockedVideoInPlaylist()
      setTimeout(() => {
        this.isLoading = false
      }, 1)
    },

    playNextVideo: function () {
      const playlistInfo = {
        playlistId: this.playlistId
      }

      if (this.nextUnblockedVideoId) {
        if (this.isEndOfPlaylist && this.shuffleEnabled) {
          this.shufflePlaylistItems()
          this.findNextUnblockedVideoInPlaylist()
        }
        this.$router.push(
          {
            path: `/watch/${this.nextUnblockedVideoId}`,
            query: playlistInfo
          }
        )
        this.showToast({
          message: this.$t('Playing Next Video')
        })
      } else {
        this.showToast({
          message: this.$t('The playlist has ended. Enable loop to continue playing')
        })
      }
    },

    playPreviousVideo: function () {
      const playlistInfo = {
        playlistId: this.playlistId
      }

      if (this.previousUnblockedVideoId) {
        if (this.videoIndexActivePlaylist === 0 && this.shuffleEnabled) {
          this.shufflePlaylistItems()
          this.findNextUnblockedVideoInPlaylist()
        }
        this.$router.push(
          {
            path: `/watch/${this.previousUnblockedVideoId}`,
            query: playlistInfo
          }
        )
        this.showToast({
          message: this.$t('Playing Previous Video')
        })
      } else {
        this.showToast({
          message: this.$t('The playlist has ended. Enable loop to continue playing')
        })
      }
    },

    getPlaylistInformationLocal: function () {
      this.isLoading = true

      this.ytGetPlaylistInfo(this.playlistId).then((result) => {
        console.log('done')
        console.log(result)

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
        this.playlistItems = this.removeDuplicateVideos(this.playlistItems)
        this.activePlaylistItems = this.playlistItems.concat([])
        this.findNextUnblockedVideoInPlaylist()

        this.isLoading = false
      }).catch((err) => {
        console.log(err)
        const errorMessage = this.$t('Local API Error (Click to copy)')
        this.showToast({
          message: `${errorMessage}: ${err}`,
          time: 10000,
          action: () => {
            navigator.clipboard.writeText(err)
          }
        })
        if (this.backendPreference === 'local' && this.backendFallback) {
          this.showToast({
            message: this.$t('Falling back to Invidious API')
          })
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
        console.log('done')
        console.log(result)

        this.playlistTitle = result.title
        this.videoCount = result.videoCount
        this.channelName = result.author
        this.channelThumbnail = result.authorThumbnails[2].url
        this.channelId = result.authorId
        this.playlistItems = this.removeDuplicateVideos(this.playlistItems.concat(result.videos))
        this.activePlaylistItems = this.playlistItems.concat([])
        this.findNextUnblockedVideoInPlaylist()

        this.isLoading = false
      }).catch((err) => {
        console.log(err)
        const errorMessage = this.$t('Invidious API Error (Click to copy)')
        this.showToast({
          message: `${errorMessage}: ${err}`,
          time: 10000,
          action: () => {
            navigator.clipboard.writeText(err)
          }
        })
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          this.showToast({
            message: this.$t('Falling back to Local API')
          })
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

      items.push(this.playlistItems[this.videoIndexOriginalPlaylist])
      remainingItems.splice(this.videoIndexOriginalPlaylist, 1)

      for (let i = 1; i < this.playlistVideoCount; i++) {
        const randomInt = Math.floor(Math.random() * remainingItems.length)

        if ((remainingItems[randomInt].videoId) !== this.videoId) {
          items.push(remainingItems[randomInt])
        }

        remainingItems.splice(randomInt, 1)
      }

      this.activePlaylistItems = items
    },

    findNextUnblockedVideoInPlaylist: function() {
      this.nextUnblockedVideoId = ''
      this.previousUnblockedVideoId = ''

      if (this.isDev) {
        console.log('activeIndex:', this.videoIndexActivePlaylist,
          'originalIndex:', this.videoIndexOriginalPlaylist, 'loop:', this.loopEnabled,
          'reverse:', this.reversePlaylist, 'shuffle:', this.shuffleEnabled,
          'end:', this.isEndOfPlaylist, 'id:', this.videoId, this.activePlaylistItems
        )
      }

      let nextVideo = null; let previousVideo = null
      if (this.loopEnabled) {
        let tempPlaylistItems
        if (this.isEndOfPlaylist) {
          // search 0 ~ index-1
          tempPlaylistItems = this.activePlaylistItems.slice(0, this.videoIndexActivePlaylist)
        } else {
          // search index+1 ~ last, 0 ~ index-1
          tempPlaylistItems = this.activePlaylistItems
            .slice(this.videoIndexActivePlaylist + 1)
            .concat(this.activePlaylistItems.slice(0, this.videoIndexActivePlaylist))
        }
        nextVideo = tempPlaylistItems.find((video) => {
          return video.authorId && (this._checkChannelTempUnblocked(video) || !this._checkChannelBlocked(video))
        })

        const tempPlaylistItemsReverse = tempPlaylistItems.concat([]).reverse()
        previousVideo = tempPlaylistItemsReverse.find((video) => {
          return video.authorId && (this._checkChannelTempUnblocked(video) || !this._checkChannelBlocked(video))
        })
      } else {
        // search index+1 ~ last
        nextVideo = this.activePlaylistItems.slice(this.videoIndexActivePlaylist + 1).find((video) => {
          return video.authorId && (this._checkChannelTempUnblocked(video) || !this._checkChannelBlocked(video))
        })

        // search 0 ~ index-1
        previousVideo = this.activePlaylistItems
          .slice(0, this.videoIndexActivePlaylist)
          .reverse().find((video) => {
            return video.authorId && (this._checkChannelTempUnblocked(video) || !this._checkChannelBlocked(video))
          })
      }

      if (this.isDev) {
        if (!nextVideo || nextVideo.videoId === this.videoId) {
          console.log('next non-blocked video not found')
        } else {
          this.nextUnblockedVideoId = nextVideo.videoId
          console.log(`next found. id: ${nextVideo.videoId} title: ${nextVideo.title}`)
        }

        if (!previousVideo || previousVideo.videoId === this.videoId) {
          console.log('previous non-blocked video not found')
        } else {
          this.previousUnblockedVideoId = previousVideo.videoId
          console.log(`previous found. id: ${previousVideo.videoId} title: ${previousVideo.title}`)
        }
      }

      this.$emit('playlist-ready', this.nextUnblockedVideoId, this.isEndOfPlaylist)
    },

    removeDuplicateVideos: function(originalItems) {
      return Array.from(new Set(originalItems.filter(item => {
        return item.authorId
      })))
    },

    ...mapActions([
      'showToast',
      'ytGetPlaylistInfo',
      'invidiousGetPlaylistInfo'
    ])
  }
})
