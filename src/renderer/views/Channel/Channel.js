import Vue from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtButton from '../../components/ft-button/ft-button.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSelect from '../../components/ft-select/ft-select.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtChannelBubble from '../../components/ft-channel-bubble/ft-channel-bubble.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/ft-element-list/ft-element-list.vue'

import ytch from 'yt-channel-info'

export default Vue.extend({
  name: 'Search',
  components: {
    'ft-card': FtCard,
    'ft-button': FtButton,
    'ft-input': FtInput,
    'ft-select': FtSelect,
    'ft-flex-box': FtFlexBox,
    'ft-channel-bubble': FtChannelBubble,
    'ft-loader': FtLoader,
    'ft-element-list': FtElementList
  },
  data: function () {
    return {
      isLoading: false,
      isElementListLoading: false,
      currentTab: 'videos',
      id: '',
      channelName: '',
      bannerUrl: '',
      thumbnailUrl: '',
      subCount: 0,
      latestVideosPage: 2,
      searchPage: 2,
      videoContinuationString: '',
      playlistContinuationString: '',
      searchContinuationString: '',
      channelDescription: '',
      videoSortBy: 'newest',
      playlistSortBy: 'last',
      lastSearchQuery: '',
      relatedChannels: [],
      latestVideos: [],
      latestPlaylists: [],
      searchResults: [],
      shownElementList: [],
      apiUsed: '',
      videoSelectNames: [
        'Newest',
        'Oldest',
        'Most Popular'
      ],
      videoSelectValues: [
        'newest',
        'oldest',
        'popular'
      ],
      playlistSelectNames: [
        'Last Video Added',
        'Newest',
        'Oldest'
      ],
      playlistSelectValues: [
        'last',
        'newest',
        'oldest'
      ]
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

    sessionSearchHistory: function () {
      return this.$store.getters.getSessionSearchHistory
    },

    formattedSubCount: function () {
      return this.subCount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },

    showFetchMoreButton: function () {
      switch (this.currentTab) {
        case 'videos':
          if (this.videoContinuationString !== '' && this.videoContinuationString !== null) {
            return true
          }
          break
        case 'playlists':
          if (this.playlistContinuationString !== '' && this.playlistContinuationString !== null) {
            return true
          }
          break
        case 'search':
          if (this.searchContinuationString !== '' && this.searchContinuationString !== null) {
            return true
          }
          break
      }

      return false
    }
  },
  watch: {
    videoSortBy () {
      this.isElementListLoading = true
      this.latestVideos = []
      switch (this.apiUsed) {
        case 'local':
          this.getChannelVideosLocal()
          break
        case 'invidious':
          this.latestVideosPage = 1
          this.channelInvidiousNextPage()
          break
        default:
          this.getChannelVideosLocal()
      }
    },

    playlistSortBy () {
      this.isElementListLoading = true
      this.latestPlaylists = []
      this.playlistContinuationString = ''
      switch (this.apiUsed) {
        case 'local':
          this.getPlaylistsLocal()
          break
        case 'invidious':
          this.channelInvidiousNextPage()
          break
        default:
          this.getPlaylistsLocal()
      }
    }
  },
  mounted: function () {
    this.id = this.$route.params.id
    this.isLoading = true

    if (!this.usingElectron) {
      this.getVideoInformationInvidious()
    } else {
      switch (this.backendPreference) {
        case 'local':
          this.apiUsed = 'local'
          this.getChannelInfoLocal()
          this.getChannelVideosLocal()
          this.getPlaylistsLocal()
          break
        case 'invidious':
          this.apiUsed = 'invidious'
          this.getChannelInfoInvidious()
          this.getPlaylistsInvidious()
          break
      }
    }
  },
  methods: {
    getChannelInfoLocal: function () {
      ytch.getChannelInfo(this.id).then((response) => {
        this.id = response.authorId
        this.channelName = response.author
        this.subCount = response.subscriberCount
        this.thumbnailUrl = response.authorThumbnails[2].url
        this.channelDescription = response.description
        this.relatedChannels = response.relatedChannels

        if (response.authorBanners !== null) {
          this.bannerUrl = `https://${response.authorBanners[response.authorBanners.length - 1].url}`
        } else {
          this.bannerUrl = null
        }

        this.isLoading = false
      }).catch((err) => {
        console.log(err)
      })
    },

    getChannelVideosLocal: function () {
      this.isElementListLoading = true
      ytch.getChannelVideos(this.id, this.videoSortBy).then((response) => {
        this.latestVideos = response.items
        this.videoContinuationString = response.continuation
        this.isElementListLoading = false
      }).catch((err) => {
        console.log(err)
      })
    },

    channelLocalNextPage: function () {
      ytch.getChannelVideosMore(this.videoContinuationString).then((response) => {
        this.latestVideos = this.latestVideos.concat(response.items)
        this.videoContinuationString = response.continuation
      }).catch((err) => {
        console.log(err)
      })
    },

    getChannelInfoInvidious: function () {
      this.isLoading = true

      this.$store.dispatch('invidiousGetChannelInfo', this.id).then((response) => {
        console.log(response)
        this.channelName = response.author
        this.id = response.authorId
        this.subCount = response.subCount
        this.thumbnailUrl = response.authorThumbnails[3].url
        this.channelDescription = response.description
        this.relatedChannels = response.relatedChannels
        this.latestVideos = response.latestVideos

        if (typeof (response.authorBanners) !== 'undefined') {
          this.bannerUrl = response.authorBanners[0].url
        }

        this.isLoading = false
      }).catch((error) => {
        console.log(error)
        this.isLoading = false
      })
    },

    channelInvidiousNextPage: function () {
      const payload = {
        resource: 'channels/videos',
        id: this.id,
        params: {
          sort_by: this.videoSortBy,
          page: this.latestVideosPage
        }
      }

      this.$store.dispatch('invidiousAPICall', payload).then((response) => {
        this.latestVideos = this.latestVideos.concat(response)
        this.latestVideosPage++
        this.isElementListLoading = false
      })
    },

    getPlaylistsLocal: function () {
      ytch.getChannelPlaylistInfo(this.id, this.playlistSortBy).then((response) => {
        console.log(response)
        this.latestPlaylists = response.items
        this.playlistContinuationString = response.continuation
        this.isElementListLoading = false
      }).catch((err) => {
        console.log(err)
      })
    },

    getPlaylistsLocalMore: function () {
      ytch.getChannelPlaylistsMore(this.playlistContinuationString).then((response) => {
        console.log(response)
        this.latestPlaylists = this.latestPlaylists.concat(response.items)
        this.playlistContinuationString = response.continuation
      }).catch((err) => {
        console.log(err)
      })
    },

    getPlaylistsInvidious: function () {
      if (this.playlistContinuationString === null) {
        console.log('There are no more playlists available for this channel')
        return
      }

      const payload = {
        resource: 'channels/playlists',
        id: this.id,
        params: {
          sort_by: this.playlistSortBy,
          continuation: this.playlistContinuationString
        }
      }

      this.$store.dispatch('invidiousAPICall', payload).then((response) => {
        this.playlistContinuationString = response.continuation
        this.latestPlaylists = this.latestPlaylists.concat(response.playlists)
        this.isElementListLoading = false
      }).catch((error) => {
        console.log(error)
      })
    },

    handleSubscription: function () {
      console.log('TODO: Channel handleSubscription')
    },

    handleFetchMore: function () {
      switch (this.currentTab) {
        case 'videos':
          switch (this.apiUsed) {
            case 'local':
              this.channelLocalNextPage()
              break
            case 'invidious':
              this.channelInvidiousNextPage()
              break
          }
          break
        case 'playlists':
          switch (this.apiUsed) {
            case 'local':
              this.getPlaylistsLocalMore()
              break
            case 'invidious':
              this.getPlaylistsInvidious()
              break
          }
          break
        case 'search':
          switch (this.apiUsed) {
            case 'local':
              this.searchChannelLocal()
              break
            case 'invidious':
              this.searchChannelInvidious()
              break
          }
          break
      }
    },

    changeTab: function (tab) {
      this.currentTab = tab
    },

    newSearch: function (query) {
      this.lastSearchQuery = query
      this.searchContinuationString = ''
      this.isElementListLoading = true
      this.searchPage = 1
      this.searchResults = []
      this.changeTab('search')
      switch (this.apiUsed) {
        case 'local':
          this.searchChannelLocal()
          break
        case 'invidious':
          this.searchChannelInvidious()
          break
      }
    },

    searchChannelLocal: function () {
      if (this.searchContinuationString === '') {
        ytch.searchChannel(this.id, this.lastSearchQuery).then((response) => {
          console.log(response)
          this.searchResults = response.items
          this.isElementListLoading = false
          this.searchContinuationString = response.continuation
        }).catch((err) => {
          console.log(err)
        })
      } else {
        ytch.searchChannelMore(this.searchContinuationString).then((response) => {
          console.log(response)
          this.searchResults = this.searchResults.concat(response.items)
          this.isElementListLoading = false
          this.searchContinuationString = response.continuation
        }).catch((err) => {
          console.log(err)
        })
      }
    },

    searchChannelInvidious: function () {
      const payload = {
        resource: 'channels/search',
        id: this.id,
        params: {
          q: this.lastSearchQuery,
          page: this.searchPage
        }
      }

      this.$store.dispatch('invidiousAPICall', payload).then((response) => {
        this.searchResults = this.searchResults.concat(response)
        this.isElementListLoading = false
        this.searchPage++
      })
    }
  }
})
