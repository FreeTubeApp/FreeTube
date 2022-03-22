import Vue from 'vue'
import { mapActions } from 'vuex'
import dateFormat from 'dateformat'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import PlaylistInfo from '../../components/playlist-info/playlist-info.vue'
import FtListVideo from '../../components/ft-list-video/ft-list-video.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'

export default Vue.extend({
  name: 'Playlist',
  components: {
    'ft-loader': FtLoader,
    'ft-card': FtCard,
    'playlist-info': PlaylistInfo,
    'ft-list-video': FtListVideo,
    'ft-flex-box': FtFlexBox
  },
  data: function () {
    return {
      isLoading: false,
      playlistId: null,
      nextPageRef: '',
      lastSearchQuery: '',
      playlistPage: 1,
      infoData: {},
      playlistItems: []
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
      return this.$store.getters.getCurrentLocale
    },
    channelBlockerList: function () {
      return this.$store.getters.getChannelBlockerList
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
      }
    },
    getPlaylistLocal: function () {
      this.isLoading = true

      this.ytGetPlaylistInfo(this.playlistId).then((result) => {
        console.log('done')
        console.log(result)

        this.infoData = {
          id: result.id,
          title: result.title,
          description: result.description ? result.description : '',
          firstVideoId: result.items[0].id,
          viewCount: result.views,
          videoCount: result.estimatedItemCount,
          lastUpdated: result.lastUpdated ? result.lastUpdated : '',
          channelName: result.author ? result.author.name : '',
          channelThumbnail: result.author ? result.author.bestAvatar.url : '',
          channelId: result.author ? result.author.channelID : '',
          infoSource: 'local'
        }

        this.playlistItems = result.items.map((video) => {
          if (typeof video.author !== 'undefined') {
            const channelName = video.author.name
            const channelId = video.author.channelID ? video.author.channelID : channelName
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
        console.log(err)
        if (this.backendPreference === 'local' && this.backendFallback) {
          console.log('Falling back to Invidious API')
          this.getPlaylistInvidious()
        } else {
          this.isLoading = false
        }
      })
    },

    getPlaylistInvidious: function () {
      this.isLoading = true

      const payload = {
        resource: 'playlists',
        id: this.playlistId
      }

      this.invidiousGetPlaylistInfo(payload).then((result) => {
        console.log('done')
        console.log(result)

        this.infoData = {
          id: result.playlistId,
          title: result.title,
          description: result.description,
          firstVideoId: result.videos[0].videoId,
          viewCount: result.viewCount,
          videoCount: result.videoCount,
          channelName: result.author,
          channelThumbnail: result.authorThumbnails[2].url.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`),
          channelId: result.authorId,
          infoSource: 'invidious'
        }

        const dateString = new Date(result.updated * 1000)
        dateString.setDate(dateString.getDate() + 1)
        this.infoData.lastUpdated = dateFormat(dateString, 'mmm dS, yyyy')

        this.playlistItems = this.playlistItems.concat(result.videos)

        this.isLoading = false
      }).catch((err) => {
        console.log(err)
        if (this.backendPreference === 'invidious' && this.backendFallback) {
          console.log('Error getting data with Invidious, falling back to local backend')
          this.getPlaylistLocal()
        } else {
          this.isLoading = false
          // TODO: Show toast with error message
        }
      })
    },

    nextPage: function () {
      const payload = {
        query: this.query,
        options: {
          nextpageRef: this.nextPageRef
        },
        nextPage: true
      }

      this.performSearch(payload)
    },

    replaceShownResults: function (history) {
      this.shownResults = history.data
      this.nextPageRef = history.nextPageRef
      this.isLoading = false
    },

    isChannelBlocked: function (item) {
      const channelIndex = this.channelBlockerList.findIndex((blocked) => {
        return blocked.authorId === item.authorId
      })

      return channelIndex !== -1
    },

    toggleBlockedChannel: function (channel) {
      if (this.isChannelBlocked(channel)) {
        this.removeChannelFromBlockList(channel)
      } else {
        this.addChannelToBlockList(channel)
      }
    },

    addChannelToBlockList: function (channel) {
      console.log('adding channel', JSON.stringify(channel))

      const locale = this.currentLocale.replace('_', '-')
      const newList = this.channelBlockerList.slice()
      newList.push(channel)
      newList.sort((a, b) => {
        return a.author.localeCompare(b.author, locale)
      })
      this.updateChannelBlockerList(newList)

      this.showToast({
        message: `"${channel.author}" ${this.$t('Video.Channel has been added to the block list')}`
      })
    },

    removeChannelFromBlockList: function (channel) {
      console.log('removing channel', JSON.stringify(channel))

      const newList = this.channelBlockerList.slice()
      for (let i = newList.length - 1; i >= 0; i--) {
        if (newList[i].authorId === channel.authorId) {
          newList.splice(i, 1)
          break
        }
      }
      this.updateChannelBlockerList(newList)

      this.showToast({
        message: `"${channel.author}" ${this.$t('Video.Channel has been removed from the block list')}`
      })
    },

    ...mapActions([
      'ytGetPlaylistInfo',
      'invidiousGetPlaylistInfo',
      'showToast',
      'updateChannelBlockerList'
    ])
  }
})
