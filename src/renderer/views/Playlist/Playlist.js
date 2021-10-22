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
      playlistId: '',
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
    userPlaylists: function () {
      return this.$store.getters.getAllPlaylists
    },
    selectedPlaylist: function () {
      return this.userPlaylists.find(playlist => playlist._id === this.playlistId)
    }
  },
  watch: {
    $route () {
      // react to route changes...
      this.getPlaylistInfo()
    }
  },
  mounted: function () {
    this.getPlaylistInfo()
  },
  methods: {
    getPlaylistInfo: function () {
      this.isLoading = true
      this.playlistId = this.$route.params.id

      if (typeof (this.selectedPlaylist) !== 'undefined') {
        this.parseUserPlaylist(this.selectedPlaylist)
      } else {
        switch (this.backendPreference) {
          case 'local':
            this.getPlaylistLocal()
            break
          case 'invidious':
            this.getPlaylistInvidious()
            break
        }
      }
    },
    getPlaylistLocal: function () {
      this.ytGetPlaylistInfo(this.playlistId).then((result) => {
        console.log('done')
        console.log(result)
        this.playlistId = result.id
        this.playlistTitle = result.title
        this.playlistDescription = result.description ? result.description : ''
        this.firstVideoId = result.items[0].id
        this.viewCount = result.views
        this.videoCount = result.estimatedItemCount
        this.lastUpdated = result.lastUpdated ? result.lastUpdated : ''
        this.channelName = result.author ? result.author.name : ''
        this.channelThumbnail = result.author ? result.author.bestAvatar.url : ''
        this.channelId = result.author ? result.author.channelID : ''
        this.infoSource = 'local'

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
      const payload = {
        resource: 'playlists',
        id: this.playlistId,
        params: {
          page: this.playlistPage
        }
      }

      this.invidiousGetPlaylistInfo(payload).then((result) => {
        console.log('done')
        console.log(result)

        this.id = result.playlistId
        this.title = result.title
        this.description = result.description
        this.firstVideoId = result.videos[0].videoId
        this.viewCount = result.viewCount
        this.videoCount = result.videoCount
        this.channelName = result.author
        this.channelThumbnail = result.authorThumbnails[2].url.replace('https://yt3.ggpht.com', `${this.currentInvidiousInstance}/ggpht/`)
        this.channelId = result.authorId
        this.infoSource = 'invidious'

        const dateString = new Date(result.updated * 1000)
        dateString.setDate(dateString.getDate() + 1)
        this.lastUpdated = dateFormat(dateString, 'mmm dS, yyyy')

        this.playlistItems = this.playlistItems.concat(result.videos)

        if (this.playlistItems.length < result.videoCount) {
          console.log('getting next page')
          this.playlistPage++
          this.getPlaylistInvidious()
        } else {
          this.isLoading = false
        }
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

    parseUserPlaylist: function (playlist) {
      this.playlistId = playlist._id
      this.playlistTitle = playlist.title
      this.playlistDescription = playlist.description

      if (playlist.videos.length > 0) {
        this.firstVideoId = playlist.videos[0].videoId
      } else {
        this.firstVideoId = ''
      }
      this.viewCount = 0
      this.videoCount = playlist.videoCount
      this.lastUpdated = undefined
      this.channelName = playlist.author ? playlist.author.name : ''
      this.channelThumbnail = playlist.author ? playlist.author.bestAvatar.url : ''
      this.channelId = playlist.author ? playlist.author.channelID : ''
      this.infoSource = 'user'

      this.playlistItems = playlist.videos

      this.isLoading = false
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

    ...mapActions([
      'ytGetPlaylistInfo',
      'invidiousGetPlaylistInfo'
    ])
  }
})
